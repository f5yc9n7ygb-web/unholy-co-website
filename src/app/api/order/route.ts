import { Buffer } from "node:buffer"
import { NextRequest, NextResponse } from "next/server"
import { getPackById } from "@/lib/shop/catalog"
import type { ShippingForm } from "@/lib/shop/types"
import { getRequiredEnv } from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"
import {
  ORDER_SESSION_COOKIE,
  createOrderContextId,
  createOrderReceipt,
  createOrderSessionToken,
} from "@/lib/server/order-session"
import {
  ORDER_BODY_LIMIT_BYTES,
  checkRateLimit,
  isValidEmail,
  parseJsonBody,
  sanitizeText,
  validateContentLength,
  validateRequestOrigin,
} from "@/lib/server/security"

const RAZORPAY_ENDPOINT = "https://api.razorpay.com/v1/orders"

/**
 * Handles POST requests to create a new order.
 * This endpoint is intended for integration with a payment gateway like Razorpay.
 * It currently returns a mock order for demonstration purposes.
 *
 * @param {NextRequest} request - The incoming Next.js request object containing order details.
 * @returns {Promise<NextResponse>} A JSON response with the created order or an error message.
 */
export async function POST(request: NextRequest) {
  try {
    const originCheck = validateRequestOrigin(request)
    if (!originCheck.ok) {
      return NextResponse.json({ ok: false, error: "Request origin is not allowed." }, { status: 403 })
    }

    const lengthCheck = validateContentLength(request, ORDER_BODY_LIMIT_BYTES)
    if (!lengthCheck.ok) {
      return NextResponse.json({ ok: false, error: "Submission is too large." }, { status: 413 })
    }

    const kv = await getKVNamespace()
    const rateLimit = await checkRateLimit(request, {
      bucket: "order-create",
      limit: 6,
      windowMs: 10 * 60 * 1000,
    }, kv)
    if (!rateLimit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }

    getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

    const body = await request.text()
    const payload = parseJsonBody<{ packId?: string; shipping?: ShippingForm }>(body, ORDER_BODY_LIMIT_BYTES)
    const packId = sanitizeText(payload.packId, 32)
    const shipping = normalizeShipping(payload.shipping)
    const pack = getPackById(packId)

    if (!pack) {
      return NextResponse.json(
        { ok: false, error: "Invalid pack selected." },
        { status: 400 }
      )
    }

    const validationError = validateShipping(shipping)
    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400 }
      )
    }

    const amount = pack.price * 100
    const currency = "INR"
    const receipt = createOrderReceipt()
    const contextId = createOrderContextId()
    const { keyId, keySecret } = getRazorpayCredentials()

    const response = await fetch(RAZORPAY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        payment_capture: 1,
        notes: {
          contextId,
        },
      }),
      cache: "no-store",
    })

    const order = await response.json()
    if (!response.ok) {
      console.error("Razorpay Error Payload:", order)
      throw new Error("Unable to create order.")
    }

    const sessionToken = createOrderSessionToken({
      contextId,
      orderId: String(order.id || ""),
      packId: pack.id,
      qty: pack.qty,
      amount,
      shipping,
    })

    const nextResponse = NextResponse.json(
      {
        ok: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
      },
      { status: 200 }
    )

    nextResponse.cookies.set(ORDER_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 60,
    })

    return nextResponse
  } catch (error: any) {
    console.error("Order API error:", error?.message || error)
    return NextResponse.json(
      { ok: false, error: "Unable to create an order right now." },
      { status: 500 }
    )
  }
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.")
  }

  return { keyId, keySecret }
}

function normalizeShipping(shipping?: ShippingForm): ShippingForm {
  return {
    name: sanitizeText(shipping?.name, 80),
    email: sanitizeText(shipping?.email, 120).toLowerCase(),
    phone: sanitizeText(shipping?.phone, 20),
    address: sanitizeText(shipping?.address, 240),
    city: sanitizeText(shipping?.city, 80),
    pincode: sanitizeText(shipping?.pincode, 12),
    state: sanitizeText(shipping?.state, 80),
  }
}

function validateShipping(shipping: ShippingForm) {
  if (!shipping.name) return "Name is required."
  if (!shipping.email) return "Email is required."
  if (!isValidEmail(shipping.email)) return "A valid email is required."
  if (!shipping.phone) return "Phone is required."
  if (!/^[6-9]\d{9}$/.test(shipping.phone.replace(/\D/g, ""))) {
    return "A valid phone number is required."
  }
  if (!shipping.address) return "Address is required."
  if (!shipping.city) return "City is required."
  if (!shipping.pincode) return "Pincode is required."
  if (!/^\d{6}$/.test(shipping.pincode)) return "A valid pincode is required."
  if (!shipping.state) return "State is required."
  return null
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
