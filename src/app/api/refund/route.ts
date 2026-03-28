/**
 * Refund/Return Request API
 *
 * Accepts refund requests from customers, validates the order exists,
 * saves to Airtable "Refunds" table, and sends confirmation emails
 * to both the customer and the team.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getRequiredEnv,
  queryAirtableRecords,
  saveRecordToAirtable,
  sendMailjetEmail,
} from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"
import {
  FORM_BODY_LIMIT_BYTES,
  checkRateLimit,
  escapeAirtableValue,
  isValidEmail,
  parseJsonBody,
  sanitizeText,
  sanitizeMultilineText,
  validateContentLength,
  validateRequestOrigin,
} from "@/lib/server/security"
import {
  buildRefundRequestHtml,
  buildRefundRequestText,
} from "@/lib/email/refund-request-template"

const REFUND_REASONS = [
  "Damaged on arrival",
  "Wrong product received",
  "Quality issue",
  "Changed my mind",
  "Other",
] as const

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
      bucket: "refund-request",
      limit: 3,
      windowMs: 30 * 60 * 1000,
    }, kv)
    if (!rateLimit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }

    const body = await request.text()
    const payload = parseJsonBody<{
      orderId?: string
      email?: string
      reason?: string
      details?: string
    }>(body, FORM_BODY_LIMIT_BYTES)

    const orderId = sanitizeText(payload.orderId, 64)
    const email = sanitizeText(payload.email, 120).toLowerCase()
    const reason = sanitizeText(payload.reason, 100)
    const details = sanitizeMultilineText(payload.details, 1000)

    if (!orderId) return NextResponse.json({ ok: false, error: "Order ID is required." }, { status: 400 })
    if (!email || !isValidEmail(email)) return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 })
    if (!reason) return NextResponse.json({ ok: false, error: "Please select a reason." }, { status: 400 })

    // Verify the order exists and belongs to this email
    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
    const orderRecords = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Payments",
      filterByFormula: `AND({Order ID} = "${escapeAirtableValue(orderId)}", LOWER({Customer Email}) = "${escapeAirtableValue(email)}")`,
      maxRecords: 1,
    })

    if (orderRecords.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "No order found matching this ID and email. Please check your confirmation email for the correct order ID.",
      }, { status: 404 })
    }

    const order = orderRecords[0]!
    const customerName = String(order.fields["Customer Name"] || "")
    const pack = String(order.fields["Pack"] || "")
    const quantity = Number(order.fields["Quantity"] || 0)
    const amount = Number(order.fields["Amount"] || 0)

    // Check if a refund request already exists for this order
    try {
      const existingRefunds = await queryAirtableRecords({
        baseId: ordersBaseId,
        tableName: "Refunds",
        filterByFormula: `{Order ID} = "${escapeAirtableValue(orderId)}"`,
        maxRecords: 1,
      })

      if (existingRefunds.length > 0) {
        const existingStatus = String(existingRefunds[0]!.fields["Status"] || "")
        if (existingStatus !== "Rejected") {
          return NextResponse.json({
            ok: false,
            error: "A refund request already exists for this order. We'll reach out to you shortly.",
          }, { status: 409 })
        }
      }
    } catch {
      // Refunds table may not exist yet — continue
    }

    // Save refund request
    await saveRecordToAirtable({
      "Order ID": orderId,
      "Customer Name": customerName,
      "Customer Email": email,
      "Pack": pack,
      "Quantity": quantity,
      "Amount": amount,
      "Reason": reason,
      "Details": details || "",
      "Status": "Pending",
      "Requested At": new Date().toISOString(),
    }, { baseId: ordersBaseId, tableName: "Refunds" })

    // Send confirmation to customer
    const siteUrl = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://theunholy.co"

    sendMailjetEmail({
      to: email,
      subject: "Refund request received — UNHOLY CO.",
      html: buildRefundRequestHtml({
        customerName: customerName.split(" ")[0] || "Customer",
        orderId,
        pack,
        reason,
        trackUrl: `${siteUrl}/track?order=${encodeURIComponent(orderId)}`,
      }),
      text: buildRefundRequestText({
        customerName: customerName.split(" ")[0] || "Customer",
        orderId,
        pack,
        reason,
        trackUrl: `${siteUrl}/track?order=${encodeURIComponent(orderId)}`,
      }),
    }).catch((err) => console.error("Refund confirmation email failed:", err))

    // Notify team
    const forwardEmail = process.env.CONTACT_FORWARD_EMAIL || "rituals@theunholy.co"
    sendMailjetEmail({
      to: forwardEmail,
      subject: `Refund request: ${orderId} — ${reason}`,
      text: `Refund request received:\n\nOrder: ${orderId}\nCustomer: ${customerName} (${email})\nPack: ${pack} (${quantity} cans)\nAmount: ₹${amount}\nReason: ${reason}\nDetails: ${details || "N/A"}\n\nReview in Airtable.`,
    }).catch((err) => console.error("Refund team notification failed:", err))

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Refund API error:", error?.message || error)
    return NextResponse.json(
      { ok: false, error: "Unable to submit the refund request right now." },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
