import { createHmac, timingSafeEqual } from "node:crypto"
import { Buffer } from "node:buffer"
import { NextRequest, NextResponse } from "next/server"
import { getPackById } from "@/lib/shop/catalog"
import { getRequiredEnv, sendOrderConfirmationEmail, saveRecordToAirtable } from "@/lib/server/integrations"
import {
  ORDER_SESSION_COOKIE,
  claimProcessedPayment,
  createReceiptToken,
  readOrderSessionToken,
} from "@/lib/server/order-session"
import {
  ORDER_BODY_LIMIT_BYTES,
  checkRateLimit,
  parseJsonBody,
  sanitizeText,
  validateContentLength,
  validateRequestOrigin,
} from "@/lib/server/security"

const RAZORPAY_ORDERS_ENDPOINT = "https://api.razorpay.com/v1/orders"
const RAZORPAY_PAYMENTS_ENDPOINT = "https://api.razorpay.com/v1/payments"

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

    const rateLimit = checkRateLimit(request, {
      bucket: "order-verify",
      limit: 10,
      windowMs: 10 * 60 * 1000,
    })
    if (!rateLimit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }

    const body = await request.text()
    const payload = parseJsonBody<{
      razorpay_order_id?: string
      razorpay_payment_id?: string
      razorpay_signature?: string
    }>(body, ORDER_BODY_LIMIT_BYTES)
    const orderId = sanitizeText(payload.razorpay_order_id, 64)
    const paymentId = sanitizeText(payload.razorpay_payment_id, 64)
    const signature = sanitizeText(payload.razorpay_signature, 128)
    const orderSession = readOrderSessionToken(request.cookies.get(ORDER_SESSION_COOKIE)?.value)

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { ok: false, error: "Payment verification payload is incomplete." },
        { status: 400 }
      )
    }

    if (!orderSession || orderSession.orderId !== orderId) {
      return NextResponse.json(
        { ok: false, error: "This checkout session is invalid or expired." },
        { status: 400 }
      )
    }

    const { keyId, keySecret } = getRazorpayCredentials()
    if (!isValidSignature(orderId, paymentId, signature, keySecret)) {
      return NextResponse.json(
        { ok: false, error: "Payment signature verification failed." },
        { status: 400 }
      )
    }

    const orderResponse = await fetch(`${RAZORPAY_ORDERS_ENDPOINT}/${orderId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      cache: "no-store",
    })

    const order = await orderResponse.json()
    if (!orderResponse.ok) {
      throw new Error("Unable to retrieve the order.")
    }

    if (String(order?.notes?.contextId || "") !== orderSession.contextId) {
      throw new Error("Order context verification failed.")
    }

    if (Number(order?.amount) !== orderSession.amount) {
      throw new Error("Order amount verification failed.")
    }

    const paymentResponse = await fetch(`${RAZORPAY_PAYMENTS_ENDPOINT}/${paymentId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      cache: "no-store",
    })
    const payment = await paymentResponse.json()
    if (!paymentResponse.ok) {
      throw new Error("Unable to retrieve the payment.")
    }

    if (String(payment?.order_id || "") !== orderId) {
      throw new Error("Payment does not belong to this order.")
    }

    if (!["authorized", "captured"].includes(String(payment?.status || ""))) {
      throw new Error("Payment is not ready for fulfillment.")
    }

    if (!claimProcessedPayment(paymentId)) {
      return NextResponse.json(
        { ok: false, error: "This payment has already been confirmed." },
        { status: 409 }
      )
    }

    const pack = getPackById(orderSession.packId)
    if (!pack) {
      throw new Error("Verified payment is missing a valid pack.")
    }

    const fullAddress = [
      orderSession.shipping.address,
      orderSession.shipping.city,
      orderSession.shipping.state,
      orderSession.shipping.pincode,
    ].filter(Boolean).join(", ")
    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

    saveRecordToAirtable({
      "Payment ID": paymentId,
      "Order ID": orderId,
      "Pack": pack.title,
      "Quantity": pack.qty,
      "Amount": pack.price,
      "Customer Name": orderSession.shipping.name,
      "Customer Email": orderSession.shipping.email,
      "Customer Phone": orderSession.shipping.phone,
      "Full Shipping Address": fullAddress,
      "Timestamp": new Date().toISOString(),
    }, { baseId: ordersBaseId, tableName: "Payments" }).catch((err) => console.error("Order Airtable save failed:", err))

    sendOrderConfirmationEmail({
      customerName: orderSession.shipping.name || "Customer",
      customerEmail: orderSession.shipping.email,
      orderId,
      paymentId,
      packTitle: pack.title,
      packQty: pack.qty,
      packPrice: pack.price,
      shippingAddress: orderSession.shipping.address,
      shippingCity: orderSession.shipping.city,
      shippingState: orderSession.shipping.state,
      shippingPincode: orderSession.shipping.pincode,
    }).catch((err) => console.error("Order confirmation email failed:", err))

    const response = NextResponse.json({
      ok: true,
      receiptToken: createReceiptToken({
        packId: pack.id,
        qty: pack.qty,
      }),
    })

    response.cookies.set(ORDER_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    })

    return response
  } catch (error: any) {
    console.error("Order verification error:", error?.message || error)
    return NextResponse.json(
      { ok: false, error: "Unable to verify the payment right now." },
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

function isValidSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")

  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== actualBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, actualBuffer)
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
