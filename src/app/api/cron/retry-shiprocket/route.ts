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

function parseFullShippingAddress(fullAddress: string) {
  const parts = fullAddress
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 4) {
    return null
  }

  return {
    shippingAddress: parts.slice(0, -3).join(", "),
    shippingCity: parts.at(-3) || "",
    shippingState: parts.at(-2) || "",
    shippingPincode: parts.at(-1) || "",
  }
}

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

      let shippingAddress = String(pf["Shipping Address"] || "")
      let shippingCity = String(pf["Shipping City"] || "")
      let shippingState = String(pf["Shipping State"] || "")
      let shippingPincode = String(pf["Shipping Pincode"] || "")

      if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
        const parsedAddress = parseFullShippingAddress(String(pf["Full Shipping Address"] || ""))
        if (parsedAddress) {
          shippingAddress ||= parsedAddress.shippingAddress
          shippingCity ||= parsedAddress.shippingCity
          shippingState ||= parsedAddress.shippingState
          shippingPincode ||= parsedAddress.shippingPincode
        }
      }

      if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
        const cartRecords = await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName: "Orders",
          filterByFormula: `{Razorpay Order ID} = "${escapeAirtableValue(orderId)}"`,
          maxRecords: 1,
        }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)

        if (cartRecords.length > 0) {
          const cf = cartRecords[0]!.fields
          shippingAddress ||= String(cf["Shipping Address"] || "")
          shippingCity ||= String(cf["Shipping City"] || "")
          shippingState ||= String(cf["Shipping State"] || "")
          shippingPincode ||= String(cf["Shipping Pincode"] || "")
        }
      }

      if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
        errors.push(`Payment ${payment.id}: missing structured shipping address for order ${orderId}`)
        continue
      }

      const addressFieldsToBackfill: Record<string, string> = {}
      if (!String(pf["Shipping Address"] || "")) addressFieldsToBackfill["Shipping Address"] = shippingAddress
      if (!String(pf["Shipping City"] || "")) addressFieldsToBackfill["Shipping City"] = shippingCity
      if (!String(pf["Shipping State"] || "")) addressFieldsToBackfill["Shipping State"] = shippingState
      if (!String(pf["Shipping Pincode"] || "")) addressFieldsToBackfill["Shipping Pincode"] = shippingPincode
      if (Object.keys(addressFieldsToBackfill).length > 0) {
        await updateAirtableRecord({
          baseId: ordersBaseId,
          tableName: "Payments",
          recordId: payment.id,
          fields: addressFieldsToBackfill,
        }).catch(() => {})
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
        logErrorToAirtable(`Shiprocket Retry Failed (Order: ${orderId})`, err, {
          route: "/api/cron/retry-shiprocket",
          service: "shiprocket",
          stage: "retry-create-order",
          orderId,
          recordId: payment.id,
        }).catch(() => {})
      }
    }
  } catch (err: any) {
    await logErrorToAirtable("Shiprocket Retry Cron", err, {
      route: "/api/cron/retry-shiprocket",
      service: "shiprocket",
      stage: "cron",
    })
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, retried, recovered, errors })
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
