import { createHmac, timingSafeEqual } from "node:crypto"
import { Buffer } from "node:buffer"
import { NextRequest, NextResponse } from "next/server"
import { getPackById } from "@/lib/shop/catalog"
import { hasAirtableOrdersConfig, getRequiredEnv, sendOrderConfirmationEmail, saveRecordToAirtable, queryAirtableRecords, updateAirtableRecord, logErrorToAirtable } from "@/lib/server/integrations"
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
import { markCartConvertedAndSupersedeForEmail } from "@/lib/server/abandoned-cart"
import { sendMetaPurchaseEvent } from "@/lib/server/meta-capi"
import {
  getSupabasePaymentByOrderId,
  getSupabasePaymentByPaymentId,
  updateSupabasePaymentByOrderId,
  upsertSupabasePayment,
} from "@/lib/server/supabase"

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
    const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID || ""

    if (!(await claimProcessedPayment(paymentId, kv))) {
      // Payment already claimed (likely by webhook). Verify the record actually exists
      // before telling the user everything is fine.
      const existingSupabasePayment = await getSupabasePaymentByPaymentId(paymentId).catch(() => null)
      const existingRecords = existingSupabasePayment || !ordersBaseId || !hasAirtableOrdersConfig()
        ? []
        : await queryAirtableRecords({
            baseId: ordersBaseId,
            tableName: "Payments",
            filterByFormula: `{Payment ID} = "${escapeAirtableValue(paymentId)}"`,
            maxRecords: 1,
          }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)

      if (!existingSupabasePayment && existingRecords.length === 0) {
        // Webhook claimed the payment but hasn't written the record yet (eventual consistency).
        // Wait briefly and retry once before giving up.
        await new Promise((r) => setTimeout(r, 2000))
        const retrySupabasePayment = await getSupabasePaymentByPaymentId(paymentId).catch(() => null)
        const retryRecords = retrySupabasePayment || !ordersBaseId || !hasAirtableOrdersConfig()
          ? []
          : await queryAirtableRecords({
              baseId: ordersBaseId,
              tableName: "Payments",
              filterByFormula: `{Payment ID} = "${escapeAirtableValue(paymentId)}"`,
              maxRecords: 1,
            }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)

        if (!retrySupabasePayment && retryRecords.length === 0) {
          // Record still doesn't exist — log and tell user to contact support
          await logErrorToAirtable("Verify: Payment claimed but record missing", `Payment ${paymentId} was claimed in KV but no Airtable record exists after retry.`, {
            route: "/api/order/verify",
            service: "checkout",
            stage: "backfill-missing",
            orderId,
            paymentId,
            severity: "critical",
          }).catch(() => {})

          return NextResponse.json(
            { ok: false, error: "Your payment was received but order confirmation is delayed. Please contact rituals@theunholy.co with your order details." },
            { status: 202 }
          )
        }
      }

      await backfillExistingPaymentRecord({
        ordersBaseId,
        orderId,
        paymentId,
        shipping: orderSession.shipping,
        fullAddress,
        amount: chargedAmount,
        promoCode: orderSession.promoCode,
        discountAmount: orderSession.discountAmount,
        pack,
        paidAt: new Date().toISOString(),
      }).catch((err) => console.error("Payment backfill failed:", err))

      await markCartConvertedAndSupersedeForEmail({
        ordersBaseId,
        orderId,
        customerEmail: orderSession.shipping.email,
      }).catch((err) => console.error("Abandoned cart update failed:", err))

      await sendMetaPurchaseForOrder({ orderSession, pack, orderId, chargedAmount })

      return createSuccessResponse({
        pack,
        orderId,
        chargedAmount,
        shippingName: orderSession.shipping.name,
        shippingCity: orderSession.shipping.city,
        shippingState: orderSession.shipping.state,
      })
    }

    // #9: Airtable dedup — KV claim succeeded, but check Airtable in case of
    // KV eventual consistency (e.g. webhook wrote the record on another edge node)
    const existingSupabasePayment = await getSupabasePaymentByPaymentId(paymentId).catch(() => null)
    const existingPayment = existingSupabasePayment || !ordersBaseId || !hasAirtableOrdersConfig()
      ? []
      : await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName: "Payments",
          filterByFormula: `{Payment ID} = "${escapeAirtableValue(paymentId)}"`,
          maxRecords: 1,
        }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)

    if (existingSupabasePayment || existingPayment.length > 0) {
      // Record already written (likely by webhook) — backfill and return success
      await backfillExistingPaymentRecord({
        ordersBaseId, orderId, paymentId,
        shipping: orderSession.shipping, fullAddress, amount: chargedAmount,
        promoCode: orderSession.promoCode, discountAmount: orderSession.discountAmount,
        pack, paidAt: new Date().toISOString(),
      }).catch((err) => console.error("Payment backfill failed:", err))
      await markCartConvertedAndSupersedeForEmail({
        ordersBaseId,
        orderId,
        customerEmail: orderSession.shipping.email,
      }).catch((err) => console.error("Abandoned cart update failed:", err))
      await sendMetaPurchaseForOrder({ orderSession, pack, orderId, chargedAmount })
      return createSuccessResponse({
        pack, orderId, chargedAmount,
        shippingName: orderSession.shipping.name,
        shippingCity: orderSession.shipping.city,
        shippingState: orderSession.shipping.state,
      })
    }

    const paidAt = new Date().toISOString()
    const supabasePayment = await upsertSupabasePayment({
      payment_id: paymentId,
      order_id: orderId,
      pack: pack.title,
      quantity: pack.qty,
      amount: chargedAmount,
      customer_name: orderSession.shipping.name,
      customer_email: orderSession.shipping.email,
      customer_phone: orderSession.shipping.phone,
      shipping_address: orderSession.shipping.address,
      shipping_city: orderSession.shipping.city,
      shipping_state: orderSession.shipping.state,
      shipping_pincode: orderSession.shipping.pincode,
      full_shipping_address: fullAddress,
      paid_at: paidAt,
      shipping_status: "Processing",
      promo_code: orderSession.promoCode || null,
      discount_amount: orderSession.discountAmount || 0,
      gst_number: orderSession.shipping.gstNumber || null,
      gst_business_name: orderSession.shipping.gstBusinessName || null,
      migrated_from: "checkout_verify",
      source_payload: {
        razorpayOrder: order,
        razorpayPayment: payment,
      },
    }).catch((err) => {
      console.error("Supabase payment persist failed, trying Airtable mirror:", err)
      return null
    })

    let paymentRecordId: string | null = null
    if (ordersBaseId && hasAirtableOrdersConfig()) {
      try {
        const airtablePayment = await saveRecordToAirtable({
          "Payment ID": paymentId,
          "Order ID": orderId,
          "Pack": pack.title,
          "Quantity": pack.qty,
          "Amount": chargedAmount,
          "Customer Name": orderSession.shipping.name,
          "Customer Email": orderSession.shipping.email,
          "Customer Phone": orderSession.shipping.phone,
          "Shipping Address": orderSession.shipping.address,
          "Shipping City": orderSession.shipping.city,
          "Shipping State": orderSession.shipping.state,
          "Shipping Pincode": orderSession.shipping.pincode,
          "Full Shipping Address": fullAddress,
          "Timestamp": paidAt,
          "Shipping Status": "Processing",
          ...(orderSession.promoCode ? { "Promo Code": orderSession.promoCode } : {}),
          "Discount Amount": orderSession.discountAmount || 0,
          ...(orderSession.shipping.gstNumber ? { "GST Number": orderSession.shipping.gstNumber } : {}),
          ...(orderSession.shipping.gstBusinessName ? { "GST Business Name": orderSession.shipping.gstBusinessName } : {}),
        }, { baseId: ordersBaseId, tableName: "Payments" })
        paymentRecordId = airtablePayment.id
      } catch (err) {
        console.error("Airtable payment mirror failed:", err)
        if (!supabasePayment) throw err
      }
    }

    if (!supabasePayment && !paymentRecordId) {
      throw new Error("No backend store is configured for captured payment persistence.")
    }

    // Critical tasks must run sequentially: if stock decrement throws, we must
    // NOT increment the promo counter (and vice versa). Running them in
    // Promise.all left the system in a half-applied state on partial failure.
    try {
      await decrementStock(pack.id, pack.qty, orderId, kv)
      if (orderSession.promoRecordId) {
        await incrementPromoUsage(orderSession.promoRecordId)
      }
    } catch (err) {
      await logErrorToAirtable(`Critical fulfillment failure (Order: ${orderId})`, err, {
        route: "/api/order/verify",
        service: "fulfillment",
        stage: "stock-promo",
        orderId,
        paymentId,
        severity: "critical",
      }).catch(() => {})
    }

    // Email dedup — webhook may also fire sendOrderConfirmationEmail; claim
    // the key here so only one path sends.
    const emailDedupKey = `email:confirm:${paymentId}`
    let shouldSendEmail = true
    if (kv) {
      const already = await kv.get(emailDedupKey)
      if (already) {
        shouldSendEmail = false
      } else {
        await kv.put(emailDedupKey, "1", { expirationTtl: 24 * 60 * 60 })
      }
    }

    await Promise.allSettled([
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
          const shippingStatus = result.pickupRequested
            ? "Pickup Requested"
            : result.awbCode
              ? "AWB Assigned"
              : "Processing"
          await updateSupabasePaymentByOrderId(orderId, {
            shiprocket_order_id: result.orderId,
            shipment_id: result.shipmentId,
            awb_code: result.awbCode || "",
            courier_name: result.courierName || "",
            shipping_status: shippingStatus,
          }).catch((err) => console.error("Failed to update Supabase status on success:", err))
          if (ordersBaseId && paymentRecordId && hasAirtableOrdersConfig()) {
            await updateAirtableRecord({
              baseId: ordersBaseId,
              tableName: "Payments",
              recordId: paymentRecordId,
              fields: {
                "Shiprocket Order ID": result.orderId,
                "Shipment ID": result.shipmentId,
                "AWB Code": result.awbCode || "",
                "Courier Name": result.courierName || "",
                "Shipping Status": shippingStatus,
              },
            }).catch((err) => console.error("Failed to update Airtable status on success:", err))
          }
        }
      }).catch(async (err) => {
        console.error("Shiprocket order creation failed:", err)
        logErrorToAirtable(`Shiprocket Failed (Order: ${orderId})`, err, {
          route: "/api/order/verify",
          service: "shiprocket",
          stage: "create-order",
          orderId,
          paymentId,
          recordId: paymentRecordId || undefined,
        }).catch(() => {})
        await updateSupabasePaymentByOrderId(orderId, { shipping_status: "Shiprocket Failed" })
          .catch((updateErr) => console.error("Failed to update Supabase status on error:", updateErr))
        if (ordersBaseId && paymentRecordId && hasAirtableOrdersConfig()) {
          await updateAirtableRecord({
            baseId: ordersBaseId,
            tableName: "Payments",
            recordId: paymentRecordId,
            fields: { "Shipping Status": "Shiprocket Failed" },
          }).catch((updateErr) => console.error("Failed to update Airtable status on error:", updateErr))
        }
      }),
      shouldSendEmail
        ? sendOrderConfirmationEmail({
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
            buyerGstNumber: orderSession.shipping.gstNumber,
            buyerBusinessName: orderSession.shipping.gstBusinessName,
          })
        : Promise.resolve(),
      markCartConvertedAndSupersedeForEmail({
        ordersBaseId,
        orderId,
        customerEmail: orderSession.shipping.email,
      })
    ]).then(results => {
      results.forEach((result, idx) => {
        if (result.status === "rejected") {
          const taskNames = ["shiprocket", "email", "cart-update"]
          console.error(`Background task ${taskNames[idx]} failed in verify route:`, result.reason)
          logErrorToAirtable(
            `Background Task ${taskNames[idx]} Failure (Order: ${orderId})`,
            result.reason?.stack || result.reason?.message || String(result.reason),
            {
              route: "/api/order/verify",
              service: "checkout",
              stage: `background-task-${taskNames[idx]}`,
              orderId,
              paymentId,
              recordId: paymentRecordId || undefined,
            }
          ).catch(e => console.error("Error logger failed:", e))
        }
      })
    })

    await sendMetaPurchaseForOrder({ orderSession, pack, orderId, chargedAmount })

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
    await logErrorToAirtable("Order Verification", error, {
      route: "/api/order/verify",
      service: "checkout",
      stage: "request",
    })
    
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

  const expectedBuf = Uint8Array.from(Buffer.from(expected))
  const receivedBuf = Uint8Array.from(Buffer.from(signature))

  if (expectedBuf.length !== receivedBuf.length) {
    return false
  }

  return timingSafeEqual(expectedBuf, receivedBuf)
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

async function sendMetaPurchaseForOrder(options: {
  orderSession: NonNullable<ReturnType<typeof readOrderSessionToken>>
  pack: NonNullable<ReturnType<typeof getPackById>>
  orderId: string
  chargedAmount: number
}) {
  await sendMetaPurchaseEvent({
    eventId: options.orderId,
    value: options.chargedAmount,
    currency: "INR",
    contentIds: [options.pack.id],
    contentName: options.pack.title,
    numItems: options.pack.qty,
    contents: [{ id: options.pack.id, quantity: 1, item_price: options.chargedAmount }],
    customer: {
      email: options.orderSession.shipping.email,
      phone: options.orderSession.shipping.phone,
      name: options.orderSession.shipping.name,
      city: options.orderSession.shipping.city,
      state: options.orderSession.shipping.state,
      pincode: options.orderSession.shipping.pincode,
    },
    attribution: options.orderSession.metaAttribution,
  })
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
    gstNumber?: string
    gstBusinessName?: string
  }
  fullAddress: string
  amount: number
  promoCode?: string
  discountAmount?: number
  pack: NonNullable<ReturnType<typeof getPackById>>
  paidAt: string
}) {
  const supabasePayment = await getSupabasePaymentByOrderId(options.orderId).catch(() => null)
  if (supabasePayment) {
    await updateSupabasePaymentByOrderId(options.orderId, {
      payment_id: options.paymentId,
      customer_name: options.shipping.name,
      customer_email: options.shipping.email,
      customer_phone: options.shipping.phone,
      shipping_address: options.shipping.address,
      shipping_city: options.shipping.city,
      shipping_state: options.shipping.state,
      shipping_pincode: options.shipping.pincode,
      full_shipping_address: options.fullAddress,
      amount: options.amount,
      promo_code: options.promoCode || null,
      discount_amount: options.discountAmount || 0,
      gst_number: options.shipping.gstNumber || null,
      gst_business_name: options.shipping.gstBusinessName || null,
    }).catch((err) => console.error("Supabase payment backfill failed:", err))
  } else {
    // Webhook claimed the payment but never wrote to Supabase (likely a Supabase outage
    // when the webhook ran). Seed the row from the verify session so Supabase becomes
    // consistent with Airtable.
    await upsertSupabasePayment({
      payment_id: options.paymentId,
      order_id: options.orderId,
      pack: options.pack.title,
      quantity: options.pack.qty,
      amount: options.amount,
      customer_name: options.shipping.name,
      customer_email: options.shipping.email,
      customer_phone: options.shipping.phone,
      shipping_address: options.shipping.address,
      shipping_city: options.shipping.city,
      shipping_state: options.shipping.state,
      shipping_pincode: options.shipping.pincode,
      full_shipping_address: options.fullAddress,
      paid_at: options.paidAt,
      shipping_status: "Processing",
      promo_code: options.promoCode || null,
      discount_amount: options.discountAmount || 0,
      gst_number: options.shipping.gstNumber || null,
      gst_business_name: options.shipping.gstBusinessName || null,
      migrated_from: "checkout_verify_backfill",
      source_payload: { source: "verify_backfill" },
    }).catch((err) => console.error("Supabase payment backfill upsert failed:", err))
  }

  if (!options.ordersBaseId || !hasAirtableOrdersConfig()) {
    return
  }

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
  if (!String(fields["Shipping Address"] || "")) updateFields["Shipping Address"] = options.shipping.address
  if (!String(fields["Shipping City"] || "")) updateFields["Shipping City"] = options.shipping.city
  if (!String(fields["Shipping State"] || "")) updateFields["Shipping State"] = options.shipping.state
  if (!String(fields["Shipping Pincode"] || "")) updateFields["Shipping Pincode"] = options.shipping.pincode
  if (!String(fields["Full Shipping Address"] || "")) updateFields["Full Shipping Address"] = options.fullAddress
  if (!Number(fields["Amount"] || 0)) updateFields["Amount"] = options.amount
  if (options.promoCode && !String(fields["Promo Code"] || "")) updateFields["Promo Code"] = options.promoCode
  if (fields["Discount Amount"] === undefined || fields["Discount Amount"] === null || fields["Discount Amount"] === "") {
    updateFields["Discount Amount"] = options.discountAmount || 0
  }
  if (options.shipping.gstNumber && !String(fields["GST Number"] || "")) {
    updateFields["GST Number"] = options.shipping.gstNumber
  }
  if (options.shipping.gstBusinessName && !String(fields["GST Business Name"] || "")) {
    updateFields["GST Business Name"] = options.shipping.gstBusinessName
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

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
