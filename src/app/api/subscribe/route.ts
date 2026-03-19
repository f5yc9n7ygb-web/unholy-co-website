import { NextRequest, NextResponse } from "next/server"
import { parseRequestBody } from "@/lib/server/parse-body"
import { createSubscriptionToken } from "@/lib/server/order-session"
import { sendSubscriptionConfirmationEmail } from "@/lib/server/integrations"
import {
  FORM_BODY_LIMIT_BYTES,
  checkRateLimit,
  hasFilledHoneypot,
  isValidEmail,
  sanitizeText,
  validateContentLength,
  validateRequestOrigin,
} from "@/lib/server/security"

/**
 * Handles POST requests for newsletter subscriptions.
 * It parses form data, validates the email address, and logs the subscription request.
 *
 * @param {NextRequest} request - The incoming Next.js request object containing the subscription data.
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

    const rateLimit = checkRateLimit(request, {
      bucket: "subscribe",
      limit: 4,
      windowMs: 60 * 60 * 1000,
    })
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

    const email = sanitizeText(payload.email, 120).toLowerCase()
    const name = sanitizeText(payload.name, 80)
    const source = sanitizeText(payload.source || "website", 40)

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 })
    }

    const siteUrl = process.env.PUBLIC_SITE_URL || request.nextUrl.origin
    const token = createSubscriptionToken({
      email,
      name: name || undefined,
      source,
    })
    const confirmUrl = new URL("/api/subscribe/confirm", siteUrl)
    confirmUrl.searchParams.set("token", token)

    await sendSubscriptionConfirmationEmail({
      email,
      confirmUrl: confirmUrl.toString(),
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Subscribe API error:", error)
    return NextResponse.json(
      { ok: false, error: "Unable to add you to the list right now." },
      { status: 500 }
    )
  }
}

/**
 * Handles GET requests to the subscribe API endpoint.
 * This method is not allowed for this endpoint and will return a 405 error.
 *
 * @returns {Promise<NextResponse>} A JSON response indicating the method is not allowed.
 */
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
