import { createHmac } from "node:crypto"
import { Buffer } from "node:buffer"
import { NextRequest, NextResponse } from "next/server"
import { getPackById } from "@/lib/shop/catalog"
import { getRequiredEnv, sendOrderConfirmationEmail, saveRecordToAirtable, queryAirtableRecords, updateAirtableRecord, logErrorToAirtable } from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"
import {
  ORDER_SESSION_COOKIE,
  claimProcessedPayment,
  createReceiptToken,
  readOrderSessionToken,
} from "@/lib/server/order-session"
import {
  ORDER_BODY_LIMIT_BYTES,
  checkRateLimit,
  escapeAirtableValue,
  parseJsonBody,
  sanitizeText,
  validateContentLength,
  validateRequestOrigin,
} from "@/lib/server/security"
import { createShiprocketOrder } from "@/lib/server/shiprocket"
import { decrementStock } from "@/lib/server/inventory"
import { incrementPromoUsage } from "@/lib/shop/promo"

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

    const kv = await getKVNamespace()
    const rateLimit = await checkRateLimit(request, {
      bucket: "order-verify",
      limit: 10,
      windowMs: 10 * 60 * 1000,
    }, kv)
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
      sessionToken?: string
    }>(body, ORDER_BODY_LIMIT_BYTES)
    const orderId = sanitizeText(payload.razorpay_order_id, 64)
    const paymentId = sanitizeText(payload.razorpay_payment_id, 64)
    const signature = sanitizeText(payload.razorpay_signature, 128)

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { ok: false, error: "Payment verification payload is incomplete." },
        { status: 400 }
      )
    }

    // Resolution order: KV (most reliable on Cloudflare edge) → body token → cookie
    const kvToken = kv ? await kv.get(`os:${orderId}`) : null
    const bodyToken = sanitizeText(payload.sessionToken, 2048)
    const cookieToken = request.cookies.get(ORDER_SESSION_COOKIE)?.value
    const rawToken = kvToken || bodyToken || cookieToken
    const orderSession = readOrderSessionToken(rawToken)

    if (!orderSession || orderSession.orderId !== orderId) {
      return NextResponse.json(
        { ok: false, error: "This checkout session is invalid or expired. Please start a new order." },
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

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`

    const [orderResponse, paymentResponse] = await Promise.all([
      fetch(`${RAZORPAY_ORDERS_ENDPOINT}/${orderId}`, { headers: { Authorization: authHeader }, cache: "no-store" }),
      fetch(`${RAZORPAY_PAYMENTS_ENDPOINT}/${paymentId}`, { headers: { Authorization: authHeader }, cache: "no-store" }),
    ])

    const [order, payment] = await Promise.all([
      orderResponse.json(),
      paymentResponse.json(),
    ])

    if (!orderResponse.ok) {
      throw new Error("Unable to retrieve the order.")
    }
    if (!paymentResponse.ok) {
      throw new Error("Unable to retrieve the payment.")
    }

    if (String(order?.notes?.contextId || "") !== orderSession.contextId) {
      throw new Error("Order context verification failed.")
    }

    if (Number(order?.amount) !== orderSession.amount) {
      throw new Error("Order amount verification failed.")
    }

    if (String(payment?.order_id || "") !== orderId) {
      throw new Error("Payment does not belong to this order.")
    }

    if (!["authorized", "captured"].includes(String(payment?.status || ""))) {
      throw new Error("Payment is not ready for fulfillment.")
    }

    const pack = getPackById(orderSession.packId)
    if (!pack) {
      throw new Error("Verified payment is missing a valid pack.")
    }

    const chargedAmount = Number((orderSession.amount / 100).toFixed(2))
    const fullAddress = [
      orderSession.shipping.address,
      orderSession.shipping.city,
      orderSession.shipping.state,
      orderSession.shipping.pincode,
    ].filter(Boolean).join(", ")
    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

    if (!(await claimProcessedPayment(paymentId, kv))) {
      await backfillExistingPaymentRecord({
        ordersBaseId,
        orderId,
        paymentId,
        shipping: orderSession.shipping,
        fullAddress,
        amount: chargedAmount,
        promoCode: orderSession.promoCode,
        discountAmount: orderSession.discountAmount,
      }).catch((err) => console.error("Payment backfill failed:", err))

      await markAbandonedCartConverted(ordersBaseId, orderId).catch((err) =>
        console.error("Abandoned cart update failed:", err)
      )

      return createSuccessResponse({
        pack,
        orderId,
        chargedAmount,
        shippingName: orderSession.shipping.name,
        shippingCity: orderSession.shipping.city,
        shippingState: orderSession.shipping.state,
      })
    }

    await saveRecordToAirtable({
      "Payment ID": paymentId,
      "Order ID": orderId,
      "Pack": pack.title,
      "Quantity": pack.qty,
      "Amount": chargedAmount,
      "Customer Name": orderSession.shipping.name,
      "Customer Email": orderSession.shipping.email,
      "Customer Phone": orderSession.shipping.phone,
      "Full Shipping Address": fullAddress,
      "Timestamp": new Date().toISOString(),
      "Shipping Status": "Processing",
      ...(orderSession.promoCode ? { "Promo Code": orderSession.promoCode } : {}),
      ...(orderSession.discountAmount ? { "Discount Amount": orderSession.discountAmount } : {}),
    }, { baseId: ordersBaseId, tableName: "Payments" })

    // Await all post-order background tasks so they don't get killed by the Edge runtime immediately
    await Promise.allSettled([
      decrementStock(pack.id, pack.qty),
      orderSession.promoRecordId ? incrementPromoUsage(orderSession.promoRecordId) : Promise.resolve(),
      createShiprocketOrder({
        orderId,
        orderDate: new Date().toISOString().split("T")[0]!,
        billingName: orderSession.shipping.name,
        billingEmail: orderSession.shipping.email,
        billingPhone: orderSession.shipping.phone,
        billingAddress: orderSession.shipping.address,
        billingCity: orderSession.shipping.city,
        billingState: orderSession.shipping.state,
        billingPincode: orderSession.shipping.pincode,
        productName: pack.title,
        productQty: pack.qty,
        productPrice: chargedAmount,
        weight: pack.qty * 0.5,
      }).then(async (result) => {
        if (result) {
          const paymentRecords = await queryAirtableRecords({
            baseId: ordersBaseId,
            tableName: "Payments",
            filterByFormula: `{Order ID} = "${escapeAirtableValue(orderId)}"`,
            maxRecords: 1,
          })
          if (paymentRecords.length > 0) {
            await updateAirtableRecord({
              baseId: ordersBaseId,
              tableName: "Payments",
              recordId: paymentRecords[0]!.id,
              fields: {
                "Shiprocket Order ID": result.orderId,
                "Shipment ID": result.shipmentId,
                "AWB Code": result.awbCode || "",
                "Courier Name": result.courierName || "",
                "Shipping Status": result.pickupRequested
                  ? "Pickup Requested"
                  : result.awbCode
                    ? "AWB Assigned"
                    : "Processing",
              },
            })
          }
        }
      }).catch(async (err) => {
        console.error("Shiprocket order creation failed:", err)
        logErrorToAirtable(`Shiprocket Failed (Order: ${orderId})`, err).catch(() => {})
        const failedRecords = await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName: "Payments",
          filterByFormula: `{Order ID} = "${escapeAirtableValue(orderId)}"`,
          maxRecords: 1,
        }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)
        if (failedRecords.length > 0) {
          await updateAirtableRecord({
            baseId: ordersBaseId,
            tableName: "Payments",
            recordId: failedRecords[0]!.id,
            fields: { "Shipping Status": "Shiprocket Failed" },
          }).catch(() => {})
        }
      }),
      sendOrderConfirmationEmail({
        customerName: orderSession.shipping.name || "Customer",
        customerEmail: orderSession.shipping.email,
        customerPhone: orderSession.shipping.phone,
        orderId,
        paymentId,
        packTitle: pack.title,
        packQty: pack.qty,
        packPrice: chargedAmount,
        shippingAddress: orderSession.shipping.address,
        shippingCity: orderSession.shipping.city,
        shippingState: orderSession.shipping.state,
        shippingPincode: orderSession.shipping.pincode,
        promoCode: orderSession.promoCode,
        discountAmount: orderSession.discountAmount,
      }),
      markAbandonedCartConverted(ordersBaseId, orderId)
    ]).then(results => {
      // Safely monitor background task exceptions
      results.forEach((result, idx) => {
        if (result.status === "rejected") {
          console.error(`Background task ${idx} failed in verify route:`, result.reason)
          logErrorToAirtable(
            `Background Task ${idx} Failure (Order: ${orderId})`,
            result.reason?.stack || result.reason?.message || String(result.reason)
          ).catch(e => console.error("Error logger failed:", e))
        }
      })
    })

    return createSuccessResponse({
      pack,
      orderId,
      chargedAmount,
      shippingName: orderSession.shipping.name,
      shippingCity: orderSession.shipping.city,
      shippingState: orderSession.shipping.state,
    })
  } catch (error: any) {
    console.error("Order verification error:", error?.message || error)
    await logErrorToAirtable("Order Verification", error)
    
    return NextResponse.json(
      { ok: false, error: "Payment verification failed. Please contact customer support." },
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

  if (expected.length !== signature.length) {
    return false
  }

  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }

  return mismatch === 0
}

function createSuccessResponse(options: {
  pack: NonNullable<ReturnType<typeof getPackById>>
  orderId: string
  chargedAmount: number
  shippingName: string
  shippingCity: string
  shippingState: string
}) {
  const response = NextResponse.json({
    ok: true,
    receiptToken: createReceiptToken({
      packId: options.pack.id,
      qty: options.pack.qty,
      orderId: options.orderId,
      packTitle: options.pack.title,
      price: options.chargedAmount,
      shippingName: options.shippingName,
      shippingCity: options.shippingCity,
      shippingState: options.shippingState,
    }),
  })

  response.cookies.set(ORDER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return response
}

async function backfillExistingPaymentRecord(options: {
  ordersBaseId: string
  orderId: string
  paymentId: string
  shipping: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  fullAddress: string
  amount: number
  promoCode?: string
  discountAmount?: number
}) {
  const paymentRecords = await queryAirtableRecords({
    baseId: options.ordersBaseId,
    tableName: "Payments",
    filterByFormula: `{Payment ID} = "${escapeAirtableValue(options.paymentId)}"`,
    maxRecords: 1,
  })

  if (paymentRecords.length === 0) {
    return
  }

  const record = paymentRecords[0]!
  const fields = record.fields
  const updateFields: Record<string, string | number> = {}

  if (!String(fields["Order ID"] || "")) updateFields["Order ID"] = options.orderId
  if (!String(fields["Customer Name"] || "")) updateFields["Customer Name"] = options.shipping.name
  if (!String(fields["Customer Email"] || "")) updateFields["Customer Email"] = options.shipping.email
  if (!String(fields["Customer Phone"] || "")) updateFields["Customer Phone"] = options.shipping.phone
  if (!String(fields["Full Shipping Address"] || "")) updateFields["Full Shipping Address"] = options.fullAddress
  if (!Number(fields["Amount"] || 0)) updateFields["Amount"] = options.amount
  if (options.promoCode && !String(fields["Promo Code"] || "")) updateFields["Promo Code"] = options.promoCode
  if (options.discountAmount && !Number(fields["Discount Amount"] || 0)) {
    updateFields["Discount Amount"] = options.discountAmount
  }

  if (Object.keys(updateFields).length === 0) {
    return
  }

  await updateAirtableRecord({
    baseId: options.ordersBaseId,
    tableName: "Payments",
    recordId: record.id,
    fields: updateFields,
  })
}

async function markAbandonedCartConverted(ordersBaseId: string, orderId: string) {
  const records = await queryAirtableRecords({
    baseId: ordersBaseId,
    tableName: "Orders",
    filterByFormula: `{Razorpay Order ID} = "${escapeAirtableValue(orderId)}"`,
    maxRecords: 1,
  })

  if (records.length === 0) {
    return
  }

  await updateAirtableRecord({
    baseId: ordersBaseId,
    tableName: "Orders",
    recordId: records[0]!.id,
    fields: { "Status": "converted", "Converted At": new Date().toISOString() },
  })
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
