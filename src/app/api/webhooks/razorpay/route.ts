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
  getRequiredEnv,
  saveRecordToAirtable,
  sendOrderConfirmationEmail,
  queryAirtableRecords,
  updateAirtableRecord,
} from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"
import { escapeAirtableValue } from "@/lib/server/security"
import { claimProcessedPayment } from "@/lib/server/order-session"
import { createShiprocketOrder } from "@/lib/server/shiprocket"
import { decrementStock } from "@/lib/server/inventory"

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

    // Handle payment.failed — log to Airtable for tracking
    if (event.event === "payment.failed") {
      const failedPayment = event.payload?.payment?.entity
      if (failedPayment) {
        const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID
        if (ordersBaseId) {
          // Update the abandoned cart record with failure info
          const cartRecords = await queryAirtableRecords({
            baseId: ordersBaseId,
            tableName: "Abandoned Carts",
            filterByFormula: `{Razorpay Order ID} = "${escapeAirtableValue(failedPayment.order_id)}"`,
            maxRecords: 1,
          }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)

          if (cartRecords.length > 0) {
            await updateAirtableRecord({
              baseId: ordersBaseId,
              tableName: "Abandoned Carts",
              recordId: cartRecords[0]!.id,
              fields: {
                Status: "payment_failed",
                "Last Failure": new Date().toISOString(),
              },
            }).catch((err) => console.error("Webhook: cart failure update failed:", err))
          }
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

    // Idempotency — skip if already processed by the verify route
    const kv = await getKVNamespace()
    if (!(await claimProcessedPayment(paymentId, kv))) {
      return NextResponse.json({ ok: true, message: "Already processed" })
    }

    // Look up the abandoned cart record to get order details
    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
    const cartRecords = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Abandoned Carts",
      filterByFormula: `{Razorpay Order ID} = "${escapeAirtableValue(orderId)}"`,
      maxRecords: 1,
    })

    if (cartRecords.length === 0) {
      console.warn(`Webhook: No abandoned cart found for order ${orderId}`)
      return NextResponse.json({ ok: true, message: "No cart record found" })
    }

    const cart = cartRecords[0]!
    const fields = cart.fields
    const packId = String(fields["Pack ID"] || "")
    const pack = getPackById(packId)

    if (!pack) {
      console.error(`Webhook: Invalid pack ID "${packId}" for order ${orderId}`)
      return NextResponse.json({ ok: true, message: "Invalid pack" })
    }

    const customerName = String(fields["Customer Name"] || "")
    const customerEmail = String(fields["Customer Email"] || "")
    const customerPhone = String(fields["Customer Phone"] || "")
    const shippingAddress = String(fields["Shipping Address"] || "")
    const shippingCity = String(fields["Shipping City"] || "")
    const shippingState = String(fields["Shipping State"] || "")
    const shippingPincode = String(fields["Shipping Pincode"] || "")
    const fullAddress = String(fields["Full Shipping Address"] || "")
    const status = String(fields["Status"] || "")
    const chargedAmount = Number(fields["Amount"] || 0) || payment.amount / 100 || pack.price
    const promoCode = String(fields["Promo Code"] || "")
    const discountAmount = Number(fields["Discount Amount"] || 0) || 0

    // Only process if not already converted
    if (status === "converted") {
      return NextResponse.json({ ok: true, message: "Already converted" })
    }

    // Save to Payments table
    await saveRecordToAirtable(
      {
        "Payment ID": paymentId,
        "Order ID": orderId,
        "Pack": pack.title,
        "Quantity": pack.qty,
        "Amount": chargedAmount,
        "Customer Name": customerName,
        "Customer Email": customerEmail,
        "Customer Phone": customerPhone,
        "Full Shipping Address": fullAddress,
        "Shipping Address": shippingAddress,
        "Shipping City": shippingCity,
        "Shipping State": shippingState,
        "Shipping Pincode": shippingPincode,
        "Timestamp": new Date().toISOString(),
        "Shipping Status": "Processing",
        ...(promoCode ? { "Promo Code": promoCode } : {}),
        ...(discountAmount ? { "Discount Amount": discountAmount } : {}),
      },
      { baseId: ordersBaseId, tableName: "Payments" }
    )

    // Mark cart as converted
    await updateAirtableRecord({
      baseId: ordersBaseId,
      tableName: "Abandoned Carts",
      recordId: cart.id,
      fields: { Status: "converted", "Converted At": new Date().toISOString() },
    }).catch((err) => console.error("Webhook: cart update failed:", err))

    // Decrement inventory
    decrementStock(pack.id, pack.qty).catch((err) => console.error("Webhook: inventory decrement failed:", err))

    // Send confirmation email
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
    }).catch((err) => console.error("Webhook: confirmation email failed:", err))

    if (shippingAddress && shippingCity && shippingState && shippingPincode) {
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
        weight: Math.max(0.5, pack.qty * 0.4),
      })
        .then(async (result) => {
          if (result) {
            // Update Airtable with shipping info
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
        })
        .catch((err) => console.error("Webhook: Shiprocket order failed:", err))
    } else {
      console.warn(`Webhook: Missing shipping address for order ${orderId}; skipping Shiprocket creation.`)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Razorpay webhook error:", error?.message || error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
