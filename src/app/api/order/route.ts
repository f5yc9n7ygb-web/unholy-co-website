import { Buffer } from "node:buffer"
import { NextRequest, NextResponse } from "next/server"
import { getPackById } from "@/lib/shop/catalog"
import type { ShippingForm } from "@/lib/shop/types"
import { validatePromoCode } from "@/lib/shop/promo"
import { hasAirtableOrdersConfig, getRequiredEnv, logErrorToAirtable, saveRecordToAirtable } from "@/lib/server/integrations"
import { checkStock, releaseStockReservation, reserveStock } from "@/lib/server/inventory"
import { getKVNamespace } from "@/lib/server/kv"
import { upsertSupabaseOrder } from "@/lib/server/supabase"
import {
  ORDER_SESSION_COOKIE,
  createOrderContextId,
  createOrderReceipt,
  createOrderSessionToken,
} from "@/lib/server/order-session"
import { getMetaAttributionFromRequest } from "@/lib/server/meta-capi"
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
 * Handles POST requests to create a Razorpay order and persist a pending cart
 * record so the backend can still fulfill it if the browser drops mid-checkout.
 *
 * @param {NextRequest} request - The incoming Next.js request object containing order details.
 * @returns {Promise<NextResponse>} A JSON response with the created order or an error message.
 */
export async function POST(request: NextRequest) {
  // Hoisted out of the try block so the outer catch can release the inventory
  // reservation if anything between reserveStock() and cart persistence throws.
  const kv = await getKVNamespace()
  let reservationKey: string | null = null
  let reservationCommitted = false
  try {
    const originCheck = validateRequestOrigin(request)
    if (!originCheck.ok) {
      return NextResponse.json({ ok: false, error: "Request origin is not allowed." }, { status: 403 })
    }

    const lengthCheck = validateContentLength(request, ORDER_BODY_LIMIT_BYTES)
    if (!lengthCheck.ok) {
      return NextResponse.json({ ok: false, error: "Submission is too large." }, { status: 413 })
    }

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

    const body = await request.text()
    const payload = parseJsonBody<{ packId?: string; shipping?: ShippingForm; promoCode?: string; promoRecordId?: string }>(body, ORDER_BODY_LIMIT_BYTES)
    const packId = sanitizeText(payload.packId, 32)
    const shipping = normalizeShipping(payload.shipping)
    const promoCode = sanitizeText(payload.promoCode, 30)
    const promoRecordId = sanitizeText(payload.promoRecordId, 64)
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

    // Check stock availability (checkStock is called inside reserveStock).
    // The reservation key is hoisted to function scope so any early-return path
    // (or the outer catch) can roll the reservation back — without that, a
    // failed checkout leaks `Reserved` counters until the 15-min KV TTL expires
    // and the row counter never decrements unless `decrementStock` runs.
    reservationKey = `pre-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const stockAvailable = await reserveStock(pack.id, pack.qty, reservationKey, kv)
    if (!stockAvailable) {
      reservationKey = null
      return NextResponse.json(
        { ok: false, error: `${pack.title} is currently out of stock. Please try a different pack.` },
        { status: 409 }
      )
    }

    const releaseReservationOnExit = async () => {
      if (reservationCommitted || !reservationKey) return
      try {
        await releaseStockReservation(reservationKey, kv)
      } catch (err) {
        console.error("Order: failed to release leaked reservation:", err)
      }
    }

    // Validate and apply promo code if provided
    let discountAmount = 0
    let validatedPromoRecordId: string | null = null
    if (promoCode) {
      const promoResult = await validatePromoCode(promoCode, pack.price)
      if (promoResult.valid) {
        discountAmount = promoResult.discountAmount
        validatedPromoRecordId = promoResult.promo.recordId
      } else {
        await releaseReservationOnExit()
        return NextResponse.json(
          { ok: false, error: `Promo code "${promoCode}" is no longer valid. Please remove it and try again.` },
          { status: 400 }
        )
      }
    }

    const finalPrice = pack.price - discountAmount
    const amount = finalPrice * 100
    const currency = "INR"
    const receipt = createOrderReceipt()
    const contextId = createOrderContextId()
    const { keyId, keySecret } = getRazorpayCredentials()

    // Razorpay can be sluggish during peak hours; enforce timeout + retry on
    // 5xx/network errors so a single flaky call doesn't kill the checkout.
    const razorpayAuthHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`
    const razorpayBody = JSON.stringify({
      amount,
      currency,
      receipt,
      payment_capture: 1,
      notes: { contextId },
    })

    let response: Response | null = null
    let order: any = null
    let lastError: unknown = null
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetch(RAZORPAY_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: razorpayAuthHeader,
          },
          body: razorpayBody,
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        })
        order = await response.json().catch(() => null)
        if (response.ok) break
        // Retry on 5xx, don't retry on 4xx (our request is broken)
        if (response.status < 500) {
          console.error("Razorpay Error Payload:", order)
          throw new Error("Unable to create order.")
        }
        lastError = new Error(`Razorpay ${response.status}`)
      } catch (err) {
        lastError = err
      }
      // backoff before retry
      if (attempt === 0) await new Promise((r) => setTimeout(r, 500))
    }

    if (!response || !response.ok || !order) {
      console.error("Razorpay create-order failed after retries:", lastError)
      await releaseReservationOnExit()
      return NextResponse.json(
        { ok: false, error: "Payment gateway is slow right now. Please try again.", retryable: true },
        { status: 503 }
      )
    }

    const sessionToken = createOrderSessionToken({
      contextId,
      orderId: String(order.id || ""),
      packId: pack.id,
      qty: pack.qty,
      amount,
      shipping,
      metaAttribution: getMetaAttributionFromRequest(request),
      promoCode: promoCode || undefined,
      promoRecordId: validatedPromoRecordId || undefined,
      discountAmount,
    })

    const nextResponse = NextResponse.json(
      {
        ok: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
        },
        // Belt-and-suspenders: pass token in body as fallback for envs where KV isn't bound
        sessionToken,
      },
      { status: 200 }
    )

    nextResponse.cookies.set(ORDER_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 60,
    })

    // Store session in KV keyed by Razorpay order ID — most reliable retrieval
    // path for Cloudflare edge where cookie Set-Cookie headers can be dropped.
    if (kv) {
      await kv.put(`os:${order.id}`, sessionToken, { expirationTtl: 30 * 60 })
    }

    // Save abandoned cart intent — will be marked "converted" on successful payment.
    // Supabase is primary; Airtable remains a best-effort mirror during migration.
    const fullAddress = [
      shipping.address,
      shipping.city,
      shipping.state,
      shipping.pincode,
    ].filter(Boolean).join(", ")
    const cartPayload = {
      razorpay_order_id: String(order.id || ""),
      customer_email: shipping.email,
      customer_name: shipping.name,
      customer_phone: shipping.phone,
      pack: pack.title,
      quantity: pack.qty,
      amount: finalPrice,
      status: "pending",
      shipping: {
        name: shipping.name,
        email: shipping.email,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        pincode: shipping.pincode,
        fullAddress,
        gstNumber: shipping.gstNumber || null,
        gstBusinessName: shipping.gstBusinessName || null,
      },
      source_payload: {
        packId: pack.id,
        price: pack.price,
        promoCode: promoCode || null,
        promoRecordId: validatedPromoRecordId || null,
        discountAmount,
        receipt,
      },
    }
    let persistedCart = false
    try {
      await upsertSupabaseOrder(cartPayload)
      persistedCart = true
    } catch (err) {
      console.error("Supabase cart persist failed, trying Airtable mirror:", err)
    }

    if (hasAirtableOrdersConfig()) {
      const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
      try {
        await saveRecordToAirtable({
          "Razorpay Order ID": String(order.id || ""),
          "Pack": pack.title,
          "Pack ID": pack.id,
          "Quantity": pack.qty,
          "Price": pack.price,
          "Amount": finalPrice,
          "Customer Name": shipping.name,
          "Customer Email": shipping.email,
          "Customer Phone": shipping.phone,
          "Shipping Address": shipping.address,
          "Shipping City": shipping.city,
          "Shipping State": shipping.state,
          "Shipping Pincode": shipping.pincode,
          "Full Shipping Address": fullAddress,
          ...(promoCode ? { "Promo Code": promoCode } : {}),
          "Discount Amount": discountAmount,
          ...(shipping.gstNumber ? { "GST Number": shipping.gstNumber } : {}),
          ...(shipping.gstBusinessName ? { "GST Business Name": shipping.gstBusinessName } : {}),
          "Status": "pending",
          "Created At": new Date().toISOString().split("T")[0],
        }, { baseId: ordersBaseId, tableName: "Orders" })
        persistedCart = true
      } catch (err) {
        console.error("Airtable cart mirror failed:", err)
        if (!persistedCart) throw err
      }
    }

    if (!persistedCart) {
      await releaseReservationOnExit()
      throw new Error("No backend store is configured for pending cart persistence.")
    }

    // From here on the cart row owns the reservation — the release-reservations
    // cron is the only thing that should roll it back if the customer doesn't
    // pay. Don't release on the cookie-set path below.
    reservationCommitted = true

    return nextResponse
  } catch (error: any) {
    console.error("Order API error:", error?.message || error)
    if (!reservationCommitted && reservationKey) {
      await releaseStockReservation(reservationKey, kv).catch((err) => {
        console.error("Order: failed to release reservation on outer catch:", err)
      })
    }
    await logErrorToAirtable("Order API", error, {
      route: "/api/order",
      service: "checkout",
      stage: "create-order",
    })
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
  const gstNumber = sanitizeText(shipping?.gstNumber, 20).toUpperCase()
  return {
    name: sanitizeText(shipping?.name, 80),
    email: sanitizeText(shipping?.email, 120).toLowerCase(),
    phone: sanitizeText(shipping?.phone, 20),
    address: sanitizeText(shipping?.address, 240),
    city: sanitizeText(shipping?.city, 80),
    pincode: sanitizeText(shipping?.pincode, 12),
    state: sanitizeText(shipping?.state, 80),
    ...(gstNumber ? { gstNumber } : {}),
    ...(shipping?.gstBusinessName ? { gstBusinessName: sanitizeText(shipping.gstBusinessName, 120) } : {}),
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
  if (shipping.gstNumber && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(shipping.gstNumber)) {
    return "A valid GSTIN is required."
  }
  return null
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
