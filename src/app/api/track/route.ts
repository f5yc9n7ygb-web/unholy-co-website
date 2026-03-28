/**
 * Order Tracking API
 *
 * Looks up order status by Razorpay order ID or customer email.
 * Returns order details + Shiprocket tracking if available.
 */

import { NextRequest, NextResponse } from "next/server"
import { getRequiredEnv, queryAirtableRecords } from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"
import { trackShipmentByAwb } from "@/lib/server/shiprocket"
import {
  FORM_BODY_LIMIT_BYTES,
  checkRateLimit,
  escapeAirtableValue,
  sanitizeText,
  validateRequestOrigin,
} from "@/lib/server/security"

export async function POST(request: NextRequest) {
  try {
    const originCheck = validateRequestOrigin(request)
    if (!originCheck.ok) {
      return NextResponse.json({ ok: false, error: "Request origin is not allowed." }, { status: 403 })
    }

    const kv = await getKVNamespace()
    const rateLimit = await checkRateLimit(request, {
      bucket: "order-track",
      limit: 10,
      windowMs: 5 * 60 * 1000,
    }, kv)
    if (!rateLimit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }

    const body = await request.json() as { query?: string }
    const query = sanitizeText(body.query, 120).toLowerCase()

    if (!query) {
      return NextResponse.json({ ok: false, error: "Please enter an order ID or email." }, { status: 400 })
    }

    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

    // Only allow tracking by order ID (not email alone) to prevent enumeration
    const filterFormula = `{Order ID} = "${escapeAirtableValue(query)}"`

    const records = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Payments",
      filterByFormula: filterFormula,
      maxRecords: 1,
    })

    if (records.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "No order found with this ID. Check the order ID in your confirmation email.",
      }, { status: 404 })
    }

    const orders = await Promise.all(
      records.map(async (record) => {
        const fields = record.fields
        const awbCode = String(fields["AWB Code"] || "")
        const shippingStatus = String(fields["Shipping Status"] || "Processing")

        // Fetch live tracking from Shiprocket if AWB exists
        let tracking = null
        if (awbCode) {
          try {
            tracking = await trackShipmentByAwb(awbCode)
          } catch {
            // Tracking fetch failed — return Airtable status instead
          }
        }

        return {
          orderId: String(fields["Order ID"] || ""),
          pack: String(fields["Pack"] || ""),
          quantity: Number(fields["Quantity"] || 0),
          amount: Number(fields["Amount"] || 0),
          placedAt: String(fields["Timestamp"] || ""),
          shippingStatus: tracking?.currentStatus || shippingStatus,
          awbCode: awbCode || null,
          courierName: tracking?.courierName || String(fields["Courier Name"] || "") || null,
          etd: tracking?.etd || String(fields["Estimated Delivery"] || "") || null,
          deliveredAt: tracking?.deliveredDate || String(fields["Delivered At"] || "") || null,
          trackingActivities: tracking?.activities || null,
        }
      })
    )

    return NextResponse.json({ ok: true, orders })
  } catch (error: any) {
    console.error("Track API error:", error?.message || error)
    return NextResponse.json(
      { ok: false, error: "Unable to look up the order right now." },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
