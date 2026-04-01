/**
 * POST /api/cron/retry-shiprocket
 *
 * Protected by CRON_SECRET bearer token.
 * Finds Payment records stuck at "Shiprocket Failed" and retries order creation.
 * Safe to call on a cron schedule (e.g. every hour).
 *
 * Strategy:
 *   1. Query Payments where Shipping Status = "Shiprocket Failed" (max 10 per run)
 *   2. For each, look up the Abandoned Cart for individual shipping address fields
 *   3. Retry createShiprocketOrder
 *   4. Update Shipping Status to new state (or "Shiprocket Failed" again if still broken)
 */

import { NextRequest, NextResponse } from "next/server"
import { PACKS } from "@/lib/shop/catalog"
import {
  getRequiredEnv,
  queryAirtableRecords,
  updateAirtableRecord,
  logErrorToAirtable,
} from "@/lib/server/integrations"
import { escapeAirtableValue } from "@/lib/server/security"
import { createShiprocketOrder } from "@/lib/server/shiprocket"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
  let retried = 0
  let recovered = 0
  const errors: string[] = []

  try {
    const failedPayments = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Payments",
      filterByFormula: `{Shipping Status} = "Shiprocket Failed"`,
      maxRecords: 10,
    })

    for (const payment of failedPayments) {
      const pf = payment.fields
      const orderId = String(pf["Order ID"] || "")
      const packTitle = String(pf["Pack"] || "")
      const customerName = String(pf["Customer Name"] || "")
      const customerEmail = String(pf["Customer Email"] || "")
      const customerPhone = String(pf["Customer Phone"] || "")
      const chargedAmount = Number(pf["Amount"] || 0)

      if (!orderId) {
        errors.push(`Payment ${payment.id}: missing Order ID`)
        continue
      }

      // Find the pack by title to get qty and weight
      const pack = PACKS.find((p) => p.title === packTitle)
      if (!pack) {
        errors.push(`Payment ${payment.id}: unknown pack "${packTitle}"`)
        continue
      }

      // Look up the Abandoned Cart to get individual shipping address fields
      const cartRecords = await queryAirtableRecords({
        baseId: ordersBaseId,
        tableName: "Orders",
        filterByFormula: `{Razorpay Order ID} = "${escapeAirtableValue(orderId)}"`,
        maxRecords: 1,
      }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)

      if (cartRecords.length === 0) {
        errors.push(`Payment ${payment.id}: no abandoned cart for order ${orderId}`)
        continue
      }

      const cf = cartRecords[0]!.fields
      const shippingAddress = String(cf["Shipping Address"] || "")
      const shippingCity = String(cf["Shipping City"] || "")
      const shippingState = String(cf["Shipping State"] || "")
      const shippingPincode = String(cf["Shipping Pincode"] || "")

      if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
        errors.push(`Payment ${payment.id}: incomplete shipping address in cart`)
        continue
      }

      retried++

      try {
        const result = await createShiprocketOrder({
          orderId,
          orderDate: new Date().toISOString().split("T")[0]!,
          billingName: customerName,
          billingEmail: customerEmail,
          billingPhone: customerPhone,
          billingAddress: shippingAddress,
          billingCity: shippingCity,
          billingState: shippingState,
          billingPincode: shippingPincode,
          productName: pack.title,
          productQty: pack.qty,
          productPrice: chargedAmount,
          weight: pack.qty * 0.5,
        })

        if (result) {
          await updateAirtableRecord({
            baseId: ordersBaseId,
            tableName: "Payments",
            recordId: payment.id,
            fields: {
              "Shiprocket Order ID": result.orderId,
              "Shipment ID": result.shipmentId,
              "AWB Code": result.awbCode || "",
              "Courier Name": result.courierName || "",
              "Shipping Status": result.pickupRequested
                ? "Pickup Requested"
                : result.awbCode
                  ? "AWB Assigned"
                  : "Processing",
            },
          })
          recovered++
        }
      } catch (err: any) {
        errors.push(`Payment ${payment.id} (order ${orderId}): ${err?.message || err}`)
        logErrorToAirtable(`Shiprocket Retry Failed (Order: ${orderId})`, err).catch(() => {})
      }
    }
  } catch (err: any) {
    await logErrorToAirtable("Shiprocket Retry Cron", err)
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, retried, recovered, errors })
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
