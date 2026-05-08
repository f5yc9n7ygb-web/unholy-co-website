/**
 * Shipping Webhook Handler
 *
 * Receives shipment status updates and updates Airtable.
 * Also sends shipping notification emails to customers.
 *
 * Security: Validates the X-API-Key header against SHIPROCKET_WEBHOOK_SECRET.
 * Empty/missing payloads are accepted without auth for test pings.
 */

import { Buffer } from "node:buffer"
import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import {
  hasAirtableOrdersConfig,
  queryAirtableRecords,
  updateAirtableRecord,
  sendMailjetEmail,
} from "@/lib/server/integrations"
import { escapeAirtableValue } from "@/lib/server/security"
import { buildShippingUpdateHtml, buildShippingUpdateText } from "@/lib/email/shipping-update-template"
import { getKVNamespace } from "@/lib/server/kv"
import { getShiprocketOrderDetails } from "@/lib/server/shiprocket"
import {
  getSupabasePaymentByAwb,
  getSupabasePaymentByOrderId,
  updateSupabasePaymentByOrderId,
} from "@/lib/server/supabase"

/** Shiprocket sr-status code → human-readable status */
const STATUS_MAP: Record<number, string> = {
  1: "New",
  2: "AWB Assigned",
  3: "Label Generated",
  4: "Pickup Scheduled",
  5: "Manifest Generated",
  6: "Shipped",
  7: "Delivered",
  8: "Cancelled",
  9: "RTO Initiated",
  10: "RTO Delivered",
  17: "Out for Delivery",
  18: "In Transit",
  19: "Out for Pickup",
  20: "In Transit",
  21: "Undelivered",
  22: "Delayed",
  38: "Reached Destination Hub",
  42: "Picked Up",
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (!rawBody.trim()) {
      return NextResponse.json({ ok: true, test: true, message: "Empty webhook ping acknowledged." })
    }

    // Verify webhook authenticity via shared secret
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("SHIPROCKET_WEBHOOK_SECRET is not configured — rejecting webhook")
      return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 500 })
    }
    const receivedToken =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      ""
    // Timing-safe comparison to prevent token brute-force via response-time analysis
    const receivedBuf = Buffer.from(receivedToken)
    const expectedBuf = Buffer.from(webhookSecret)
    if (
      receivedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(Uint8Array.from(receivedBuf), Uint8Array.from(expectedBuf))
    ) {
      return NextResponse.json({ ok: false, error: "Invalid webhook token" }, { status: 401 })
    }

    let body: {
      order_id?: string        // format: "{your_order_id}_{shipment_id}"
      sr_order_id?: number     // Shiprocket's internal order ID
      awb?: string
      current_status?: string
      current_status_id?: number
      shipment_status?: string
      shipment_status_id?: number
      etd?: string
      courier_name?: string
      scans?: Array<{
        date: string
        status: string
        activity: string
        location: string
      }>
      test?: boolean
      event?: string
      type?: string
    }

    try {
      body = JSON.parse(rawBody) as typeof body
    } catch {
      return NextResponse.json({ ok: true, test: true, message: "Non-JSON webhook ping acknowledged." })
    }

    const {
      order_id: compositeOrderId,
      awb,
      current_status,
      current_status_id,
      shipment_status_id,
      courier_name,
      etd,
    } = body

    if (!compositeOrderId && !awb) {
      return NextResponse.json({
        ok: true,
        test: true,
        message: "Webhook connection acknowledged. No shipment payload to process.",
      })
    }

    // Extract the original Razorpay order ID from composite format
    // Shiprocket sends order_id as "{your_order_id}_{shipment_id}"
    const razorpayOrderId = compositeOrderId?.split("_").slice(0, -1).join("_") || compositeOrderId

    if (!razorpayOrderId && !awb) {
      return NextResponse.json({ ok: false, error: "Missing order_id or awb" }, { status: 400 })
    }

    const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID || ""
    const effectiveStatusId = current_status_id || shipment_status_id
    const statusLabel = current_status ||
      (effectiveStatusId ? STATUS_MAP[effectiveStatusId] : null) ||
      "Updated"

    // Find the payment record — try by order ID first, fall back to AWB
    const filterFormula = razorpayOrderId
      ? `{Order ID} = "${escapeAirtableValue(razorpayOrderId)}"`
      : `{AWB Code} = "${escapeAirtableValue(awb || "")}"`

    const supabasePayment = razorpayOrderId
      ? await getSupabasePaymentByOrderId(razorpayOrderId).catch(() => null)
      : awb
        ? await getSupabasePaymentByAwb(awb).catch(() => null)
        : null
    const records = !ordersBaseId || !hasAirtableOrdersConfig()
      ? []
      : await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName: "Payments",
          filterByFormula: filterFormula,
          maxRecords: 1,
        }).catch((err) => {
          console.error("Shipping webhook: Airtable mirror lookup failed:", err)
          return [] as Awaited<ReturnType<typeof queryAirtableRecords>>
        })

    if (!supabasePayment && records.length === 0) {
      console.warn(`Shipping webhook: No payment record found for ${razorpayOrderId || awb}`)
      return NextResponse.json({ ok: true, message: "No matching record" })
    }

    const record = records[0]
    const fields = record?.fields || {}

    // Idempotency applies to email sends only — Airtable writes are idempotent
    // assignments and dropping them caused AWBs to go missing when Shiprocket
    // sent a duplicate status event without the AWB before the one with it.
    const kv = await getKVNamespace()
    let alreadyEmailed = false
    if (kv && effectiveStatusId) {
      const dedupKey = `sr_evt:${supabasePayment?.order_id || record?.id || razorpayOrderId || awb}:${effectiveStatusId}`
      alreadyEmailed = Boolean(await kv.get(dedupKey))
    }

    // Update Airtable with new status
    const updateFields: Record<string, string | number | null> = {
      "Shipping Status": statusLabel,
    }

    let effectiveAwb = awb || String(supabasePayment?.awb_code || fields["AWB Code"] || "")
    let effectiveCourier = courier_name || String(supabasePayment?.courier_name || fields["Courier Name"] || "")

    if (awb && !fields["AWB Code"]) {
      updateFields["AWB Code"] = awb
    }
    if (courier_name) {
      updateFields["Courier Name"] = courier_name
    }
    if (etd) {
      updateFields["Estimated Delivery"] = etd
    }

    // Fallback: if the record still lacks an AWB after applying this payload,
    // fetch it directly from Shiprocket. Shiprocket frequently sends status
    // updates without the `awb` field, leaving AWB Code empty forever.
    if (!effectiveAwb) {
      const shiprocketOrderId = Number(supabasePayment?.shiprocket_order_id || fields["Shiprocket Order ID"])
      if (shiprocketOrderId) {
        try {
          const details = await getShiprocketOrderDetails(shiprocketOrderId)
          if (details?.awbCode) {
            updateFields["AWB Code"] = details.awbCode
            effectiveAwb = details.awbCode
            if (details.courierName && !effectiveCourier) {
              updateFields["Courier Name"] = details.courierName
              effectiveCourier = details.courierName
            }
          }
        } catch (err: any) {
          console.warn(`Shipping webhook: Shiprocket fallback fetch failed for order ${shiprocketOrderId}: ${err?.message || err}`)
        }
      }
    }

    // Mark delivered date
    if (effectiveStatusId === 7) {
      updateFields["Delivered At"] = new Date().toISOString()
    }

    const supabaseUpdateFields = {
      shipping_status: statusLabel,
      ...(updateFields["AWB Code"] ? { awb_code: String(updateFields["AWB Code"]) } : {}),
      ...(updateFields["Courier Name"] ? { courier_name: String(updateFields["Courier Name"]) } : {}),
      ...(updateFields["Estimated Delivery"] ? { estimated_delivery: String(updateFields["Estimated Delivery"]) } : {}),
      ...(updateFields["Delivered At"] ? { delivered_at: String(updateFields["Delivered At"]) } : {}),
    }
    if (supabasePayment?.order_id || razorpayOrderId) {
      await updateSupabasePaymentByOrderId(supabasePayment?.order_id || razorpayOrderId || "", supabaseUpdateFields)
        .catch((err) => console.error("Shipping webhook: Supabase update failed:", err))
    }

    if (ordersBaseId && record && hasAirtableOrdersConfig()) {
      await updateAirtableRecord({
        baseId: ordersBaseId,
        tableName: "Payments",
        recordId: record.id,
        fields: updateFields,
      })
    }

    // Claim the idempotency key now that we've applied the update so future
    // duplicate events skip the email but can still re-sync Airtable.
    if (kv && effectiveStatusId && !alreadyEmailed) {
      const dedupKey = `sr_evt:${supabasePayment?.order_id || record?.id || razorpayOrderId}:${effectiveStatusId}`
      await kv.put(dedupKey, "1", { expirationTtl: 48 * 60 * 60 }).catch(() => {})
    }

    // Send email notification for key status changes
    const customerEmail = String(supabasePayment?.customer_email || fields["Customer Email"] || "")
    const customerName = String(supabasePayment?.customer_name || fields["Customer Name"] || "")
    const orderId = String(supabasePayment?.order_id || fields["Order ID"] || razorpayOrderId || "")
    // Notify on: Shipped(6), In Transit(18), Out for Delivery(17), Delivered(7), Picked Up(42)
    const shouldNotify = [6, 7, 17, 18, 42].includes(effectiveStatusId || 0) && !alreadyEmailed
    const isDelivered = effectiveStatusId === 7

    if (shouldNotify && customerEmail) {
      const siteUrl = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://theunholy.co"
      const trackingUrl = `${siteUrl}/track?order=${encodeURIComponent(orderId)}`

      sendMailjetEmail({
        to: customerEmail,
        subject: isDelivered
          ? "Your BloodThirst has arrived."
          : "Your BloodThirst is on the move.",
        html: buildShippingUpdateHtml({
          customerName: customerName.split(" ")[0] || "Customer",
          status: statusLabel,
          awbCode: effectiveAwb,
          courierName: effectiveCourier,
          etd: etd || null,
          trackingUrl,
          isDelivered,
        }),
        text: buildShippingUpdateText({
          customerName: customerName.split(" ")[0] || "Customer",
          status: statusLabel,
          awbCode: effectiveAwb,
          courierName: effectiveCourier,
          etd: etd || null,
          trackingUrl,
          isDelivered,
        }),
      }).catch((err) => console.error("Shipping webhook: email failed:", err))
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Shipping webhook error:", error?.message || error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Shipping webhook endpoint is live. Send POST requests for shipment updates.",
  })
}
