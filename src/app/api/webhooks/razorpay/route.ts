/**
 * Razorpay Webhook Handler
 *
 * Catches payment events server-side so orders aren't lost if the
 * browser closes mid-payment. Processes `payment.captured` events.
 *
 * Required env vars:
 *   RAZORPAY_WEBHOOK_SECRET — webhook secret from Razorpay Dashboard → Webhooks
 *
 * Setup: In Razorpay Dashboard → Webhooks, add:
 *   URL: https://theunholy.co/api/webhooks/razorpay
 *   Events: payment.captured
 *   Secret: <generate and set as RAZORPAY_WEBHOOK_SECRET>
 */

import { createHmac, timingSafeEqual } from "node:crypto"
import { Buffer } from "node:buffer"
import { NextRequest, NextResponse } from "next/server"
import { getPackById } from "@/lib/shop/catalog"
import {
  hasAirtableOrdersConfig,
  saveRecordToAirtable,
  sendOrderConfirmationEmail,
  sendMailjetEmail,
  queryAirtableRecords,
  updateAirtableRecord,
  logErrorToAirtable,
} from "@/lib/server/integrations"
import { buildPaymentFailedHtml, buildPaymentFailedText } from "@/lib/email/payment-failed-template"
import { getKVNamespace, getExecutionContext } from "@/lib/server/kv"
import { escapeAirtableValue } from "@/lib/server/security"
import { claimProcessedPayment, readOrderSessionToken, releaseProcessedPayment } from "@/lib/server/order-session"
import { createShiprocketOrder } from "@/lib/server/shiprocket"
import { decrementStock, releaseStockByPack } from "@/lib/server/inventory"
import { incrementPromoUsageByCode } from "@/lib/shop/promo"
import { markCartConvertedAndSupersedeForEmail } from "@/lib/server/abandoned-cart"
import { sendMetaPurchaseEvent } from "@/lib/server/meta-capi"
import {
  getSupabaseOrderByRazorpayOrderId,
  getSupabasePaymentByPaymentId,
  updateSupabaseOrderByRazorpayOrderId,
  updateSupabasePaymentByOrderId,
  upsertSupabasePayment,
} from "@/lib/server/supabase"

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured.")
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    const body = await request.text()

    // Verify webhook signature
    const receivedSignature = request.headers.get("x-razorpay-signature") || ""
    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex")

    const expectedBuf = Uint8Array.from(Buffer.from(expectedSignature))
    const receivedBuf = Uint8Array.from(Buffer.from(receivedSignature))

    if (
      expectedBuf.length !== receivedBuf.length ||
      !timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body) as {
      event: string
      payload?: {
        payment?: {
          entity?: {
            id: string
            order_id: string
            amount: number
            status: string
            notes?: Record<string, string>
            email?: string
            contact?: string
          }
        }
      }
    }

    // Handle payment.failed — log to Airtable and notify customer
    if (event.event === "payment.failed") {
      const failedPayment = event.payload?.payment?.entity
      if (failedPayment) {
        let failedEmailQueued = false
        let failedStockReleased = false
        const kv = await getKVNamespace()

        // Per-payment idempotency: Razorpay can re-deliver the same failed
        // event (network retries, manual replay from dashboard). Without a
        // claim, each delivery decrements `reserved` again and would eat into
        // someone else's active reservation for the same pack.
        if (kv) {
          const failedClaimKey = `payfail:${failedPayment.id}`
          const alreadyHandled = await kv.get(failedClaimKey)
          if (alreadyHandled) {
            return NextResponse.json({ ok: true, event: "payment.failed", deduped: true })
          }
          await kv.put(failedClaimKey, "1", { expirationTtl: 24 * 60 * 60 })
        }

        const supabaseCart = await getSupabaseOrderByRazorpayOrderId(failedPayment.order_id).catch(() => null)
        if (supabaseCart) {
          updateSupabaseOrderByRazorpayOrderId(failedPayment.order_id, { status: "payment_failed" })
            .catch((err) => console.error("Webhook: Supabase cart failure update failed:", err))
          const sourcePayload = supabaseCart.source_payload || {}
          const packId = String(sourcePayload.packId || "")
          const qty = Number(supabaseCart.quantity || 0)
          if (packId && qty > 0) {
            try {
              await releaseStockByPack(packId, qty, kv)
              failedStockReleased = true
            } catch (err) {
              console.error("Webhook: Supabase release stock by pack failed:", err)
            }
          }
        }

        const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID
        if (ordersBaseId && hasAirtableOrdersConfig()) {
          const cartRecords = await queryAirtableRecords({
            baseId: ordersBaseId,
            tableName: "Orders",
            filterByFormula: `{Razorpay Order ID} = "${escapeAirtableValue(failedPayment.order_id)}"`,
            maxRecords: 1,
          }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)

          if (cartRecords.length > 0) {
            const cart = cartRecords[0]!
            const cf = cart.fields

            // Update cart status
            updateAirtableRecord({
              baseId: ordersBaseId,
              tableName: "Orders",
              recordId: cart.id,
              fields: {
                Status: "payment_failed",
              },
            }).catch((err) => console.error("Webhook: cart failure update failed:", err))

            // Notify the customer
            const customerEmail = String(cf["Customer Email"] || "")
            const customerName = String(cf["Customer Name"] || "Customer")
            const packTitle = String(cf["Pack"] || "BloodThirst")
            const siteUrl = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://theunholy.co"
            if (!failedStockReleased) {
              const packId = String(cf["Pack ID"] || "")
              const qty = Number(cf["Quantity"] || 0)
              if (packId && qty > 0) {
                try {
                  await releaseStockByPack(packId, qty, kv)
                  failedStockReleased = true
                } catch (err) {
                  console.error("Webhook: Airtable release stock by pack failed:", err)
                }
              }
            }

            if (customerEmail) {
              sendMailjetEmail({
                to: customerEmail,
                subject: "Your payment didn't go through.",
                html: buildPaymentFailedHtml({ customerName, packTitle, shopUrl: `${siteUrl}/shop` }),
                text: buildPaymentFailedText({ customerName, packTitle, shopUrl: `${siteUrl}/shop` }),
              }).catch((err) => console.error("Webhook: payment failed email error:", err))
              failedEmailQueued = true
            }
          }
        }

        if (supabaseCart?.customer_email && !failedEmailQueued) {
          const sourcePayload = (supabaseCart.source_payload || {}) as Record<string, unknown>
          const customerName = supabaseCart.customer_name || "Customer"
          const packTitle = supabaseCart.pack || "BloodThirst"
          const siteUrl = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://theunholy.co"

          sendMailjetEmail({
            to: supabaseCart.customer_email,
            subject: "Your payment didn't go through.",
            html: buildPaymentFailedHtml({ customerName, packTitle: String(sourcePayload.packTitle || packTitle), shopUrl: `${siteUrl}/shop` }),
            text: buildPaymentFailedText({ customerName, packTitle: String(sourcePayload.packTitle || packTitle), shopUrl: `${siteUrl}/shop` }),
          }).catch((err) => console.error("Webhook: payment failed email error:", err))
        }
      }
      return NextResponse.json({ ok: true, event: "payment.failed" })
    }

    // Only process payment.captured beyond this point
    if (event.event !== "payment.captured") {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const payment = event.payload?.payment?.entity
    if (!payment) {
      return NextResponse.json({ ok: false, error: "No payment entity" }, { status: 400 })
    }

    const { id: paymentId, order_id: orderId } = payment

    // Idempotency layer 1 — KV claim (fast, survives across edge isolates)
    const kv = await getKVNamespace()
    if (!(await claimProcessedPayment(paymentId, kv))) {
      return NextResponse.json({ ok: true, message: "Already processed" })
    }
    const orderSession = readOrderSessionToken(kv ? await kv.get(`os:${orderId}`) : null)

    const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID || ""

    // Idempotency layer 2 — Supabase primary dedup, Airtable as mirror fallback.
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
      return NextResponse.json({ ok: true, message: "Already processed (dedup)" })
    }

    // Look up the abandoned cart record to get order details.
    const supabaseCart = await getSupabaseOrderByRazorpayOrderId(orderId).catch(() => null)
    const cartRecords = supabaseCart || !ordersBaseId || !hasAirtableOrdersConfig()
      ? []
      : await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName: "Orders",
          filterByFormula: `{Razorpay Order ID} = "${escapeAirtableValue(orderId)}"`,
          maxRecords: 1,
        })

    if (!supabaseCart && cartRecords.length === 0) {
      console.error(`Webhook: No abandoned cart found for order ${orderId}, payment ${paymentId}`)
      await logErrorToAirtable(`Razorpay Webhook Missing Cart (Order: ${orderId})`, `Payment ${paymentId} captured but no Orders row exists for ${orderId}. Releasing claim so Razorpay retry can process it.`, {
        route: "/api/webhooks/razorpay",
        service: "razorpay",
        stage: "missing-cart",
        orderId,
        paymentId,
        severity: "critical",
      })
      // Release the KV claim so the Razorpay retry can actually process the payment
      await releaseProcessedPayment(paymentId, kv)
      // Return 500 so Razorpay retries — the cart record may not have been written yet
      return NextResponse.json({ ok: false, error: "Cart record not found, retry expected" }, { status: 500 })
    }

    const cart = cartRecords[0]
    const fields = cart?.fields || {}
    const shipping = (supabaseCart?.shipping || {}) as Record<string, unknown>
    const sourcePayload = (supabaseCart?.source_payload || {}) as Record<string, unknown>
    const packId = String(sourcePayload.packId || fields["Pack ID"] || "")
    const pack = getPackById(packId)

    if (!pack) {
      console.error(`Webhook: Invalid pack ID "${packId}" for order ${orderId}`)
      return NextResponse.json({ ok: true, message: "Invalid pack" })
    }

    const customerName = String(supabaseCart?.customer_name || fields["Customer Name"] || shipping.name || "")
    const customerEmail = String(supabaseCart?.customer_email || fields["Customer Email"] || shipping.email || "")
    const customerPhone = String(supabaseCart?.customer_phone || fields["Customer Phone"] || shipping.phone || "")
    const shippingAddress = String(shipping.address || fields["Shipping Address"] || "")
    const shippingCity = String(shipping.city || fields["Shipping City"] || "")
    const shippingState = String(shipping.state || fields["Shipping State"] || "")
    const shippingPincode = String(shipping.pincode || fields["Shipping Pincode"] || "")
    const buyerGstNumber = String(
      fields["GST Number"] || fields["GST number"] ||
      orderSession?.shipping.gstNumber ||
      shipping.gstNumber || ""
    )
    const buyerBusinessName = String(
      fields["GST Business Name"] ||
      orderSession?.shipping.gstBusinessName ||
      shipping.gstBusinessName || ""
    )
    const fullAddress = String(shipping.fullAddress || fields["Full Shipping Address"] || "")
    const status = String(supabaseCart?.status || fields["Status"] || "")
    const chargedAmount = Number(supabaseCart?.amount || fields["Amount"] || 0) || payment.amount / 100 || pack.price
    const promoCode = String(sourcePayload.promoCode || fields["Promo Code"] || "")
    const discountAmount = Number(sourcePayload.discountAmount || fields["Discount Amount"] || 0) || 0

    // Only process if not already converted
    if (status === "converted") {
      return NextResponse.json({ ok: true, message: "Already converted" })
    }

    const paidAt = new Date().toISOString()
    const supabasePayment = await upsertSupabasePayment({
      payment_id: paymentId,
      order_id: orderId,
      pack: pack.title,
      quantity: pack.qty,
      amount: chargedAmount,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_state: shippingState,
      shipping_pincode: shippingPincode,
      full_shipping_address: fullAddress,
      paid_at: paidAt,
      shipping_status: "Processing",
      promo_code: promoCode || null,
      discount_amount: discountAmount,
      gst_number: buyerGstNumber || null,
      gst_business_name: buyerBusinessName || null,
      migrated_from: "razorpay_webhook",
      source_payload: {
        razorpayPayment: payment,
        cart: supabaseCart || fields,
      },
    }).catch((err) => {
      console.error("Webhook: Supabase payment persist failed, trying Airtable mirror:", err)
      return null
    })

    let paymentRecordId: string | null = null
    if (ordersBaseId && hasAirtableOrdersConfig()) {
      try {
        const airtablePayment = await saveRecordToAirtable(
          {
            "Payment ID": paymentId,
            "Order ID": orderId,
            "Pack": pack.title,
            "Quantity": pack.qty,
            "Amount": chargedAmount,
            "Customer Name": customerName,
            "Customer Email": customerEmail,
            "Customer Phone": customerPhone,
            "Shipping Address": shippingAddress,
            "Shipping City": shippingCity,
            "Shipping State": shippingState,
            "Shipping Pincode": shippingPincode,
            "Full Shipping Address": fullAddress,
            "Timestamp": paidAt,
            "Shipping Status": "Processing",
            ...(promoCode ? { "Promo Code": promoCode } : {}),
            "Discount Amount": discountAmount,
            ...(buyerGstNumber ? { "GST Number": buyerGstNumber } : {}),
            ...(buyerBusinessName ? { "GST Business Name": buyerBusinessName } : {}),
          },
          { baseId: ordersBaseId, tableName: "Payments" }
        )
        paymentRecordId = airtablePayment.id
      } catch (err) {
        console.error("Webhook: Airtable payment mirror failed:", err)
        if (!supabasePayment) throw err
      }
    }

    if (!supabasePayment && !paymentRecordId) {
      throw new Error("No backend store is configured for captured payment persistence.")
    }

    // ── Critical path: stock + promo (must succeed before fulfillment) ────────
    // These are awaited sequentially so a promo increment never lands without
    // a matching stock decrement (and vice versa). If either throws we still
    // return 200 because the payment is captured — ops must reconcile manually.
    try {
      await decrementStock(pack.id, pack.qty, orderId, kv)
      if (promoCode) {
        await incrementPromoUsageByCode(promoCode)
      }
    } catch (err) {
      await logErrorToAirtable(`Critical fulfillment failure (Order: ${orderId})`, err, {
        route: "/api/webhooks/razorpay",
        service: "fulfillment",
        stage: "stock-promo",
        orderId,
        paymentId,
        severity: "critical",
      })
    }

    await sendMetaPurchaseEvent({
      eventId: orderId,
      value: chargedAmount,
      currency: "INR",
      contentIds: [pack.id],
      contentName: pack.title,
      numItems: pack.qty,
      contents: [{ id: pack.id, quantity: 1, item_price: chargedAmount }],
      customer: {
        email: orderSession?.shipping.email || customerEmail,
        phone: orderSession?.shipping.phone || customerPhone,
        name: orderSession?.shipping.name || customerName,
        city: orderSession?.shipping.city || shippingCity,
        state: orderSession?.shipping.state || shippingState,
        pincode: orderSession?.shipping.pincode || shippingPincode,
      },
      attribution: orderSession?.metaAttribution,
    })

    // ── Email dedup: verify endpoint may have already sent the confirmation ──
    const emailDedupKey = `email:confirm:${paymentId}`
    let shouldSendEmail = true
    if (kv) {
      const alreadySent = await kv.get(emailDedupKey)
      if (alreadySent) {
        shouldSendEmail = false
      } else {
        await kv.put(emailDedupKey, "1", { expirationTtl: 24 * 60 * 60 })
      }
    }

    const backgroundTasks: Promise<unknown>[] = [
      // Mark this cart converted AND supersede any other in-flight carts from
      // the same customer email. The helper does both via the shared path that
      // /api/order/verify uses — keeps webhook + verify behavior identical so
      // whichever races to conversion first, the abandoned-cart sweep stays clean.
      // We pass skipConvertedUpdate:false because the webhook owns the
      // converted-row state in this flow.
      markCartConvertedAndSupersedeForEmail({
        ordersBaseId,
        orderId,
        customerEmail,
      }).catch((err) => {
        console.error("Webhook: cart conversion/supersede failed:", err)
        updateSupabaseOrderByRazorpayOrderId(orderId, { status: "converted" })
          .catch((e) => console.error("Webhook: fallback Supabase conversion update failed:", e))
        if (!ordersBaseId || !cart || !hasAirtableOrdersConfig()) return Promise.resolve()
        return updateAirtableRecord({
          baseId: ordersBaseId,
          tableName: "Orders",
          recordId: cart.id,
          fields: { Status: "converted", "Converted At": new Date().toISOString().split("T")[0]! },
        }).catch((e) => console.error("Webhook: fallback Airtable conversion update failed:", e))
      }),
    ]
    if (shouldSendEmail) {
      backgroundTasks.push(
        sendOrderConfirmationEmail({
          customerName: customerName || "Customer",
          customerEmail,
          customerPhone,
          orderId,
          paymentId,
          packTitle: pack.title,
          packQty: pack.qty,
          packPrice: chargedAmount,
          shippingAddress,
          shippingCity,
          shippingState,
          shippingPincode,
          promoCode: promoCode || undefined,
          discountAmount: discountAmount || undefined,
          buyerGstNumber: buyerGstNumber || undefined,
          buyerBusinessName: buyerBusinessName || undefined,
        })
      )
    }

    if (shippingAddress && shippingCity && shippingState && shippingPincode) {
      backgroundTasks.push(
        createShiprocketOrder({
          orderId,
          orderDate: new Date().toISOString().split("T")[0]!,
          billingName: customerName,
          billingEmail: customerEmail,
          billingPhone: customerPhone,
          billingAddress: shippingAddress,
          billingCity: shippingCity,
          billingState: shippingState,
          billingPincode: shippingPincode,
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
            }).catch((err) => console.error("Webhook: Failed to update Supabase status on success:", err))
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
              }).catch((err) => console.error("Webhook: Failed to update Airtable status on success:", err))
            }
          }
        }).catch(async (err) => {
          console.error("Webhook: Shiprocket order creation failed:", err)
          logErrorToAirtable(`Shiprocket Failed (Order: ${orderId})`, err, {
            route: "/api/webhooks/razorpay",
            service: "shiprocket",
            stage: "create-order",
            orderId,
            paymentId,
            recordId: paymentRecordId || undefined,
          }).catch(() => {})
          await updateSupabasePaymentByOrderId(orderId, { shipping_status: "Shiprocket Failed" })
            .catch((updateErr) => console.error("Webhook: Failed to update Supabase status on error:", updateErr))
          if (ordersBaseId && paymentRecordId && hasAirtableOrdersConfig()) {
            await updateAirtableRecord({
              baseId: ordersBaseId,
              tableName: "Payments",
              recordId: paymentRecordId,
              fields: { "Shipping Status": "Shiprocket Failed" },
            }).catch((updateErr) => console.error("Webhook: Failed to update Airtable status on error:", updateErr))
          }
        })
      )
    } else {
      console.warn(`Webhook: Missing shipping address for order ${orderId}; skipping Shiprocket creation.`)
    }

    // Fire-and-forget background tasks using Cloudflare waitUntil when available
    // so Razorpay gets a sub-second ACK even if Shiprocket/Mailjet are slow.
    // In local dev (no execution context), we await to keep behavior unchanged.
    const execCtx = await getExecutionContext()
    const bgPromise = Promise.allSettled(backgroundTasks)
    if (execCtx) {
      execCtx.waitUntil(bgPromise)
    } else {
      await bgPromise
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Razorpay webhook error:", error?.message || error)
    await logErrorToAirtable("Razorpay Webhook", error, {
      route: "/api/webhooks/razorpay",
      service: "razorpay",
      stage: "request",
    })
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
