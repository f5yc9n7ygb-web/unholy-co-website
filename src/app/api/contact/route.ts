import { NextRequest, NextResponse } from "next/server"
import { parseRequestBody } from "@/lib/server/parse-body"
import { saveRecordToAirtable, sendMailjetEmail } from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"
import {
  FORM_BODY_LIMIT_BYTES,
  checkRateLimit,
  escapeHtml,
  hasFilledHoneypot,
  isValidEmail,
  sanitizeMultilineText,
  sanitizeText,
  validateContentLength,
  validateRequestOrigin,
} from "@/lib/server/security"

const CONTACT_NOTIFICATION_SUBJECT = "New contact submission — UNHOLY CO."

/**
 * Handles POST requests for the contact form.
 * It parses form data from JSON, URL-encoded, or multipart/form-data formats,
 * validates the email, and logs the submission.
 *
 * @param {NextRequest} request - The incoming Next.js request object containing the form data.
 * @returns {Promise<NextResponse>} A JSON response indicating success or failure.
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
      bucket: "contact",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    }, kv)
    if (!rateLimit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }

    const payload = await parseRequestBody(request, FORM_BODY_LIMIT_BYTES)
    if (hasFilledHoneypot(payload)) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const name = sanitizeText(payload.name, 80)
    const email = sanitizeText(payload.email, 120).toLowerCase()
    const message = sanitizeMultilineText(payload.message, 2000)
    const phone = sanitizeText(payload.phone, 24)
    const source = sanitizeText(payload.source || "website", 40)
    const inquiryType = sanitizeText(payload.inquiry_type, 40)

    if (!name || !message || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Name, valid email, and message are required." },
        { status: 400 }
      )
    }

    await saveRecordToAirtable({
      Type: "Contact",
      Name: name,
      Email: email,
      Phone: phone || null,
      Message: message,
      "Inquiry Type": inquiryType || null,
      Source: source,
      SubmittedAt: new Date().toISOString(),
    })

    // Notify team and send auto-response in parallel (best-effort)
    try {
      await Promise.all([
        notifyTeam({ name, email, message, phone, source, inquiryType }),
        sendAutoResponse(name, email),
      ])
    } catch (notificationError) {
      console.error("Contact notification error:", notificationError)
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Contact API error:", error)
    return NextResponse.json(
      { ok: false, error: "Unable to submit your message right now." },
      { status: 500 }
    )
  }
}

async function notifyTeam(payload: {
  name: string
  email: string
  message: string
  phone?: string
  source?: string
  inquiryType?: string
}) {
  const recipients = (process.env.CONTACT_FORWARD_EMAIL || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)

  if (!recipients.length) {
    console.warn("CONTACT_FORWARD_EMAIL is not configured; skipping notification email.")
    return
  }

  const html = `
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    ${payload.phone ? `<p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>` : ""}
    ${payload.inquiryType ? `<p><strong>Inquiry Type:</strong> ${escapeHtml(payload.inquiryType)}</p>` : ""}
    <p><strong>Source:</strong> ${escapeHtml(payload.source || "website")}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(payload.message).replace(/\n/g, "<br />")}</p>
  `

  await sendMailjetEmail({
    to: recipients,
    subject: CONTACT_NOTIFICATION_SUBJECT,
    html,
    text: `New contact submission from ${payload.name} (${payload.email})`,
  })
}

async function sendAutoResponse(name: string, email: string) {
  const firstName = name.split(" ")[0] || "there"

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #C9C9C9; background: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 32px;">
        <span style="font-size: 14px; letter-spacing: 0.3em; font-weight: 700; color: #F6F6F6;">UNHOLY <span style="color: #B00020;">CO.</span></span>
      </div>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #C9C9C9;">
        Hey ${escapeHtml(firstName)},
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #C9C9C9;">
        We've received your message. Someone from the coven will get back to you within 24 hours.
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #C9C9C9;">
        For urgent matters, email us directly at <a href="mailto:rituals@theunholy.co" style="color: #B00020; text-decoration: underline;">rituals@theunholy.co</a>.
      </p>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(176,0,32,0.2); text-align: center;">
        <p style="margin: 0; font-size: 11px; letter-spacing: 0.2em; color: rgba(201,201,201,0.3);">
          UNHOLY CO. STAY UNHOLY.
        </p>
      </div>
    </div>
  `

  const text = `Hey ${firstName},\n\nWe've received your message. Someone from the coven will get back to you within 24 hours.\n\nFor urgent matters, email us directly at rituals@theunholy.co.\n\n— UNHOLY CO.`

  await sendMailjetEmail({
    to: email,
    subject: "We got your message — UNHOLY CO.",
    html,
    text,
  })
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
