import { NextRequest, NextResponse } from "next/server"
import { validatePromoCode } from "@/lib/shop/promo"
import { getKVNamespace } from "@/lib/server/kv"
import {
  FORM_BODY_LIMIT_BYTES,
  checkRateLimit,
  parseJsonBody,
  sanitizeText,
  validateContentLength,
  validateRequestOrigin,
} from "@/lib/server/security"

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
      bucket: "promo-validate",
      limit: 10,
      windowMs: 5 * 60 * 1000,
    }, kv)
    if (!rateLimit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }

    const body = await request.text()
    const payload = parseJsonBody<{ code?: string; orderTotal?: number }>(body, FORM_BODY_LIMIT_BYTES)
    const code = sanitizeText(payload.code, 30)
    const orderTotal = Math.max(0, Number(payload.orderTotal) || 0)

    if (!code) {
      return NextResponse.json({ ok: false, error: "Please enter a promo code." }, { status: 400 })
    }

    const result = await validatePromoCode(code, orderTotal)

    if (!result.valid) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      code: result.promo.code,
      discountType: result.promo.discountType,
      discountValue: result.promo.discountValue,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
      promoRecordId: result.promo.recordId,
    })
  } catch (error: any) {
    console.error("Promo validation error:", error?.message || error)
    return NextResponse.json(
      { ok: false, error: "Unable to validate promo code right now." },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
