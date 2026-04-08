/**
 * Order Tracking API
 *
 * Two modes:
 *  - track (default): look up a single order by Order ID
 *  - history: verify ownership via email + any Order ID, then return all orders for that email
 */

import { NextRequest, NextResponse } from "next/server"
import { getRequiredEnv, queryAirtableRecords } from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"
import { trackShipmentByAwb } from "@/lib/server/shiprocket"
import {
  checkRateLimit,
  escapeAirtableValue,
  sanitizeText,
  validateRequestOrigin,
} from "@/lib/server/security"

async function mapRecordToOrder(record: { fields: Record<string, unknown> }, fetchTracking: boolean) {
  const fields = record.fields
  const awbCode = String(fields["AWB Code"] || "")
  const shippingStatus = String(fields["Shipping Status"] || "Processing")

  let tracking = null
  if (fetchTracking && awbCode && !shippingStatus.toLowerCase().includes("deliver")) {
    try {
      tracking = await trackShipmentByAwb(awbCode)
    } catch {
      // Tracking fetch failed — fall back to Airtable status
    }
  }

  return {
    orderId: String(fields["Order ID"] || ""),
    customerEmail: String(fields["Customer Email"] || ""),
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
}

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

    const body = await request.json() as { query?: string; orderId?: string; mode?: "track" | "history" }
    const query = sanitizeText(body.query, 120)
    const orderIdHint = sanitizeText(body.orderId, 64)
    const mode = body.mode === "history" ? "history" : "track"

    if (!query) {
      return NextResponse.json({ ok: false, error: "Please enter an order ID or email." }, { status: 400 })
    }

    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

    // ── History mode: email + any order ID → return all orders for that email ──
    if (mode === "history") {
      if (!query.includes("@")) {
        return NextResponse.json({ ok: false, error: "Please enter your email address." }, { status: 400 })
      }
      if (!orderIdHint) {
        return NextResponse.json({
          ok: false,
          error: "Please enter any past order ID to verify it's you.",
        }, { status: 400 })
      }

      // Per-email brute-force throttle: 6 failed/successful attempts/hour per email.
      // Prevents IP-rotating attackers from guessing order IDs against a known victim.
      const emailLower = query.toLowerCase()
      if (kv) {
        const emailKey = `rl:track-history-email:${emailLower}`
        const existing = await kv.get(emailKey)
        const count = existing ? Number(existing) || 0 : 0
        if (count >= 6) {
          return NextResponse.json(
            { ok: false, error: "Too many attempts for this email. Please try again later." },
            { status: 429, headers: { "Retry-After": "3600" } }
          )
        }
        await kv.put(emailKey, String(count + 1), { expirationTtl: 3600 })
      }

      // Step 1: Verify ownership — email + orderId must match a real record
      const verifyRecords = await queryAirtableRecords({
        baseId: ordersBaseId,
        tableName: "Payments",
        filterByFormula: `AND({Customer Email} = "${escapeAirtableValue(query.toLowerCase())}", {Order ID} = "${escapeAirtableValue(orderIdHint)}")`,
        maxRecords: 1,
      })

      if (verifyRecords.length === 0) {
        return NextResponse.json({
          ok: false,
          error: "Email and order ID don't match. Check your confirmation email for the correct order ID.",
        }, { status: 404 })
      }

      // Step 2: Fetch all orders for this verified email
      const allRecords = await queryAirtableRecords({
        baseId: ordersBaseId,
        tableName: "Payments",
        filterByFormula: `{Customer Email} = "${escapeAirtableValue(query.toLowerCase())}"`,
        maxRecords: 20,
        sort: [{ field: "Timestamp", direction: "desc" }],
      })

      // Only fetch live Shiprocket tracking for recent non-delivered orders (first 3)
      const orders = await Promise.all(
        allRecords.map((record, i) => mapRecordToOrder(record, i < 3))
      )

      return NextResponse.json({ ok: true, orders, mode: "history" })
    }

    // ── Track mode: order ID only (self-authenticating) ──
    if (query.includes("@")) {
      return NextResponse.json({
        ok: false,
        error: "To look up by email, use the 'My Orders' tab instead.",
      }, { status: 400 })
    }

    const records = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Payments",
      filterByFormula: `{Order ID} = "${escapeAirtableValue(query)}"`,
      maxRecords: 1,
    })

    if (records.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "No order found with this ID. Check the order ID in your confirmation email.",
      }, { status: 404 })
    }

    const orders = await Promise.all(records.map((r) => mapRecordToOrder(r, true)))

    return NextResponse.json({ ok: true, orders, mode: "track" })
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
