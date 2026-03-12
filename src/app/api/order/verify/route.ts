import { createHmac, timingSafeEqual } from "node:crypto"
import { Buffer } from "node:buffer"
import { NextRequest, NextResponse } from "next/server"
import { getPackById } from "@/lib/shop/catalog"

const RAZORPAY_ORDERS_ENDPOINT = "https://api.razorpay.com/v1/orders"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const orderId = String(payload.razorpay_order_id || "").trim()
    const paymentId = String(payload.razorpay_payment_id || "").trim()
    const signature = String(payload.razorpay_signature || "").trim()

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { ok: false, error: "Payment verification payload is incomplete." },
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
      const description = order?.error?.description || "Unable to retrieve the order."
      throw new Error(description)
    }

    const packId = String(order?.notes?.packId || "").trim()
    const pack = getPackById(packId)
    if (!pack) {
      throw new Error("Verified payment is missing a valid pack.")
    }

    return NextResponse.json({
      ok: true,
      orderId,
      paymentId,
      packId: pack.id,
      qty: pack.qty,
    })
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
