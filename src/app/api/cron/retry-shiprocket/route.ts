/**
 * POST /api/cron/retry-shiprocket
 *
 * Protected by CRON_SECRET bearer token.
 * Finds Payment records stuck at "Shiprocket Failed" and retries order creation.
 * Safe to call on a cron schedule (e.g. every hour).
 *
 * Strategy:
 *   1. Pull failed payments from Supabase (primary) and the Airtable mirror; dedup by Order ID.
 *   2. Recover structured shipping address from the payment row, then fall back
 *      to parsing the legacy "Full Shipping Address" string, then to the
 *      Orders/abandoned-cart row.
 *   3. Retry createShiprocketOrder.
 *   4. Update both stores with the new state (or "Shiprocket Failed" if still broken).
 */

import { NextRequest, NextResponse } from "next/server"
import { PACKS } from "@/lib/shop/catalog"
import {
  hasAirtableOrdersConfig,
  queryAirtableRecords,
  updateAirtableRecord,
  logErrorToAirtable,
} from "@/lib/server/integrations"
import { escapeAirtableValue, isAuthorizedCron } from "@/lib/server/security"
import { createShiprocketOrder } from "@/lib/server/shiprocket"
import {
  getSupabaseOrderByRazorpayOrderId,
  getSupabasePaymentByOrderId,
  getSupabasePaymentsByShippingStatus,
  updateSupabasePaymentByOrderId,
  type SupabasePayment,
} from "@/lib/server/supabase"

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

type FailedTarget = {
  orderId: string
  packTitle: string
  customerName: string
  customerEmail: string
  customerPhone: string
  chargedAmount: number
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingPincode: string
  fullAddress: string
  airtableRecordId?: string
  supabaseRow?: SupabasePayment
}

function mapSupabasePayment(payment: SupabasePayment): FailedTarget {
  return {
    orderId: String(payment.order_id || ""),
    packTitle: String(payment.pack || ""),
    customerName: String(payment.customer_name || ""),
    customerEmail: String(payment.customer_email || ""),
    customerPhone: String(payment.customer_phone || ""),
    chargedAmount: Number(payment.amount || 0),
    shippingAddress: String(payment.shipping_address || ""),
    shippingCity: String(payment.shipping_city || ""),
    shippingState: String(payment.shipping_state || ""),
    shippingPincode: String(payment.shipping_pincode || ""),
    fullAddress: String(payment.full_shipping_address || ""),
    supabaseRow: payment,
  }
}

function mapAirtablePayment(record: { id: string; fields: Record<string, unknown> }): FailedTarget {
  const f = record.fields
  return {
    orderId: String(f["Order ID"] || ""),
    packTitle: String(f["Pack"] || ""),
    customerName: String(f["Customer Name"] || ""),
    customerEmail: String(f["Customer Email"] || ""),
    customerPhone: String(f["Customer Phone"] || ""),
    chargedAmount: Number(f["Amount"] || 0),
    shippingAddress: String(f["Shipping Address"] || ""),
    shippingCity: String(f["Shipping City"] || ""),
    shippingState: String(f["Shipping State"] || ""),
    shippingPincode: String(f["Shipping Pincode"] || ""),
    fullAddress: String(f["Full Shipping Address"] || ""),
    airtableRecordId: record.id,
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID || ""
  let retried = 0
  let recovered = 0
  const errors: string[] = []

  try {
    const supabaseFailed = await getSupabasePaymentsByShippingStatus("Shiprocket Failed", 10).catch((err) => {
      errors.push(`supabase failed lookup: ${err?.message || String(err)}`)
      return [] as SupabasePayment[]
    })

    const airtableFailed = ordersBaseId && hasAirtableOrdersConfig()
      ? await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName: "Payments",
          filterByFormula: `{Shipping Status} = "Shiprocket Failed"`,
          maxRecords: 10,
        }).catch((err) => {
          errors.push(`airtable failed lookup: ${err?.message || String(err)}`)
          return [] as Awaited<ReturnType<typeof queryAirtableRecords>>
        })
      : []

    const targets: FailedTarget[] = []
    const seen = new Set<string>()
    for (const payment of supabaseFailed) {
      const t = mapSupabasePayment(payment)
      if (!t.orderId || seen.has(t.orderId)) continue
      seen.add(t.orderId)
      targets.push(t)
    }
    for (const record of airtableFailed) {
      const t = mapAirtablePayment(record)
      if (!t.orderId) {
        if (t.airtableRecordId) targets.push(t)
        continue
      }
      if (seen.has(t.orderId)) {
        const existing = targets.find((other) => other.orderId === t.orderId)
        if (existing && !existing.airtableRecordId) existing.airtableRecordId = t.airtableRecordId
        continue
      }
      seen.add(t.orderId)
      targets.push(t)
    }

    for (const target of targets) {
      const orderId = target.orderId
      const recordTag = target.airtableRecordId || `supabase:${orderId}`

      if (!orderId) {
        errors.push(`${recordTag}: missing Order ID`)
        continue
      }

      const pack = PACKS.find((p) => p.title === target.packTitle)
      if (!pack) {
        errors.push(`${recordTag}: unknown pack "${target.packTitle}"`)
        continue
      }

      let { shippingAddress, shippingCity, shippingState, shippingPincode } = target

      if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
        const parsedAddress = parseFullShippingAddress(target.fullAddress)
        if (parsedAddress) {
          shippingAddress ||= parsedAddress.shippingAddress
          shippingCity ||= parsedAddress.shippingCity
          shippingState ||= parsedAddress.shippingState
          shippingPincode ||= parsedAddress.shippingPincode
        }
      }

      // Last resort — pull from the Orders / abandoned-cart row.
      if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
        const supabaseCart = await getSupabaseOrderByRazorpayOrderId(orderId).catch(() => null)
        if (supabaseCart) {
          const shipping = (supabaseCart.shipping || {}) as Record<string, unknown>
          shippingAddress ||= String(shipping.address || "")
          shippingCity ||= String(shipping.city || "")
          shippingState ||= String(shipping.state || "")
          shippingPincode ||= String(shipping.pincode || "")
        }
      }
      if ((!shippingAddress || !shippingCity || !shippingState || !shippingPincode) && ordersBaseId && hasAirtableOrdersConfig()) {
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
        errors.push(`${recordTag}: missing structured shipping address for order ${orderId}`)
        continue
      }

      // Backfill missing structured-address fields on the Supabase / Airtable rows.
      const supabaseRow = target.supabaseRow || (await getSupabasePaymentByOrderId(orderId).catch(() => null))
      const supabaseBackfill: Record<string, unknown> = {}
      if (!String(supabaseRow?.shipping_address || "")) supabaseBackfill.shipping_address = shippingAddress
      if (!String(supabaseRow?.shipping_city || "")) supabaseBackfill.shipping_city = shippingCity
      if (!String(supabaseRow?.shipping_state || "")) supabaseBackfill.shipping_state = shippingState
      if (!String(supabaseRow?.shipping_pincode || "")) supabaseBackfill.shipping_pincode = shippingPincode
      if (Object.keys(supabaseBackfill).length > 0) {
        await updateSupabasePaymentByOrderId(orderId, supabaseBackfill)
          .catch((err) => console.error(`Supabase address backfill for ${orderId} failed:`, err))
      }

      if (target.airtableRecordId && ordersBaseId && hasAirtableOrdersConfig()) {
        const airtableBackfill: Record<string, string> = {}
        if (!target.shippingAddress) airtableBackfill["Shipping Address"] = shippingAddress
        if (!target.shippingCity) airtableBackfill["Shipping City"] = shippingCity
        if (!target.shippingState) airtableBackfill["Shipping State"] = shippingState
        if (!target.shippingPincode) airtableBackfill["Shipping Pincode"] = shippingPincode
        if (Object.keys(airtableBackfill).length > 0) {
          await updateAirtableRecord({
            baseId: ordersBaseId,
            tableName: "Payments",
            recordId: target.airtableRecordId,
            fields: airtableBackfill,
          }).catch(() => {})
        }
      }

      retried++

      try {
        const result = await createShiprocketOrder({
          orderId,
          orderDate: new Date().toISOString().split("T")[0]!,
          billingName: target.customerName,
          billingEmail: target.customerEmail,
          billingPhone: target.customerPhone,
          billingAddress: shippingAddress,
          billingCity: shippingCity,
          billingState: shippingState,
          billingPincode: shippingPincode,
          productName: pack.title,
          productQty: pack.qty,
          productPrice: target.chargedAmount,
          weight: pack.qty * 0.5,
        })

        if (result) {
          const shippingStatus = result.pickupRequested
            ? "Pickup Requested"
            : result.awbCode
              ? "AWB Assigned"
              : "Processing"

          await updateSupabasePaymentByOrderId(orderId, {
            shiprocket_order_id: result.orderId,
            shipment_id: result.shipmentId,
            awb_code: result.awbCode || "",
            courier_name: result.courierName || "",
            shipping_status: shippingStatus,
          }).catch((err) => console.error(`Supabase Shiprocket retry update for ${orderId} failed:`, err))

          if (target.airtableRecordId && ordersBaseId && hasAirtableOrdersConfig()) {
            await updateAirtableRecord({
              baseId: ordersBaseId,
              tableName: "Payments",
              recordId: target.airtableRecordId,
              fields: {
                "Shiprocket Order ID": result.orderId,
                "Shipment ID": result.shipmentId,
                "AWB Code": result.awbCode || "",
                "Courier Name": result.courierName || "",
                "Shipping Status": shippingStatus,
              },
            }).catch((err) => console.error(`Airtable Shiprocket retry update for ${orderId} failed:`, err))
          }

          recovered++
        }
      } catch (err: any) {
        errors.push(`${recordTag} (order ${orderId}): ${err?.message || err}`)
        logErrorToAirtable(`Shiprocket Retry Failed (Order: ${orderId})`, err, {
          route: "/api/cron/retry-shiprocket",
          service: "shiprocket",
          stage: "retry-create-order",
          orderId,
          recordId: target.airtableRecordId,
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
