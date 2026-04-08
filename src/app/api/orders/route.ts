import { NextRequest, NextResponse } from "next/server"
import { getRequiredEnv, queryAirtableRecords } from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"
import {
  FORM_BODY_LIMIT_BYTES,
  checkRateLimit,
  escapeAirtableValue,
  isValidEmail,
  parseJsonBody,
  sanitizeText,
  validateContentLength,
  validateRequestOrigin,
} from "@/lib/server/security"

/**
 * Look up all orders for an email address.
 * Returns payment records from Airtable sorted by most recent.
 */
export async function POST(request: NextRequest) {
  try {
    const originCheck = validateRequestOrigin(request)
    if (!originCheck.ok) {
      return NextResponse.json({ ok: false, error: "Request origin is not allowed." }, { status: 403 })
    }

    const lengthCheck = validateContentLength(request, FORM_BODY_LIMIT_BYTES)
    if (!lengthCheck.ok) {
      return NextResponse.json({ ok: false, error: "Submission is too large." }, { status: 413 })
    }

    const kv = await getKVNamespace()
    const rateLimit = await checkRateLimit(request, {
      bucket: "order-history",
      limit: 8,
      windowMs: 5 * 60 * 1000,
    }, kv)
    if (!rateLimit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }

    const body = await request.text()
    const payload = parseJsonBody<{ email?: string; orderId?: string }>(body, FORM_BODY_LIMIT_BYTES)
    const email = sanitizeText(payload.email, 120).toLowerCase()
    const orderId = sanitizeText(payload.orderId, 64)

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "An order ID is required." }, { status: 400 })
    }

    // Per-email rate limit (prevents an attacker rotating IPs from brute-forcing
    // order IDs against a known victim email).
    if (kv) {
      const emailKey = `rl:order-history-email:${email}`
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

    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

    const records = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Payments",
      filterByFormula: `AND({Order ID} = "${escapeAirtableValue(orderId)}", LOWER({Customer Email}) = "${escapeAirtableValue(email)}")`,
      maxRecords: 50,
      sort: [{ field: "Timestamp", direction: "desc" }],
    })

    const orders = records.map((r) => ({
      orderId: r.fields["Order ID"] || "",
      paymentId: r.fields["Payment ID"] || "",
      pack: r.fields["Pack"] || "",
      quantity: r.fields["Quantity"] || 0,
      amount: r.fields["Amount"] || 0,
      shippingStatus: r.fields["Shipping Status"] || "Processing",
      courierName: r.fields["Courier Name"] || "",
      awbCode: r.fields["AWB Code"] || "",
      timestamp: r.fields["Timestamp"] || "",
      promoCode: r.fields["Promo Code"] || "",
      discountAmount: r.fields["Discount Amount"] || 0,
    }))

    return NextResponse.json({ ok: true, orders })
  } catch (error: any) {
    console.error("Order history error:", error?.message || error)
    return NextResponse.json(
      { ok: false, error: "Unable to look up orders right now." },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
