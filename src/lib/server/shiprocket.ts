/**
 * Shiprocket API client.
 *
 * All functions gracefully skip when Shiprocket env vars are missing,
 * so the existing order flow continues to work without Shiprocket credentials.
 *
 * Required env vars:
 *   SHIPROCKET_EMAIL    — Shiprocket API user email
 *   SHIPROCKET_PASSWORD — Shiprocket API user password
 *
 * Optional:
 *   SHIPROCKET_CHANNEL_ID — Sales channel ID (defaults to first channel)
 *   SHIPROCKET_PICKUP_LOCATION — Pickup location name in Shiprocket (defaults to "Primary")
 */

import { getKVNamespace, type KVNamespace } from "@/lib/server/kv"

const API_BASE = "https://apiv2.shiprocket.in/v1/external"
const TOKEN_KV_KEY = "shiprocket:auth_token"
const TOKEN_TTL_SECONDS = 9 * 24 * 60 * 60 // 9 days (token valid for 10)

// In-memory fallback for local dev
let cachedToken: { token: string; expiresAt: number } | null = null

/* ─── Config ─────────────────────────────────────────────────────────────────── */

function hasShiprocketConfig() {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD)
}

/* ─── Auth ───────────────────────────────────────────────────────────────────── */

async function getAuthToken(kv?: KVNamespace | null): Promise<string> {
  // Try KV cache first
  if (kv) {
    const stored = await kv.get(TOKEN_KV_KEY)
    if (stored) return stored
  }

  // Try in-memory cache
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  // Fetch new token
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "User-Agent": "UnholyCo/1.0 (Integration/API)"
    },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Shiprocket auth failed (${response.status}): ${text}`)
  }

  const data = (await response.json()) as { token: string }
  const token = data.token

  // Cache in KV
  if (kv) {
    await kv.put(TOKEN_KV_KEY, token, { expirationTtl: TOKEN_TTL_SECONDS }).catch(() => {})
  }

  // Cache in memory
  cachedToken = { token, expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000 }

  return token
}

async function authHeaders(kv?: KVNamespace | null): Promise<Record<string, string>> {
  const token = await getAuthToken(kv)
  return {
    "Content-Type": "application/json",
    "User-Agent": "UnholyCo/1.0 (Integration/API)",
    Authorization: `Bearer ${token}`,
  }
}

/* ─── Types ──────────────────────────────────────────────────────────────────── */

export type ShiprocketOrderInput = {
  /** Razorpay order ID — used as the Shiprocket order_id */
  orderId: string
  /** Date of order in YYYY-MM-DD format */
  orderDate: string
  /** Customer billing/shipping details */
  billingName: string
  billingEmail: string
  billingPhone: string
  billingAddress: string
  billingCity: string
  billingState: string
  billingPincode: string
  /** Product details */
  productName: string
  productQty: number
  productPrice: number
  /** Weight in kg */
  weight: number
}

export type ShiprocketOrderResult = {
  orderId: number
  shipmentId: number
  awbCode: string | null
  courierName: string | null
  status: string
  pickupRequested: boolean
}

export type ShiprocketTrackingResult = {
  awbCode: string
  courierName: string
  currentStatus: string
  currentStatusDescription: string
  shipmentStatus: number
  deliveredDate: string | null
  etd: string | null
  activities: Array<{
    date: string
    status: string
    activity: string
    location: string
  }>
}

/* ─── Create Order ───────────────────────────────────────────────────────────── */

/**
 * Creates a Shiprocket order and requests automatic courier assignment.
 * Returns null if Shiprocket is not configured (graceful skip).
 */
export async function createShiprocketOrder(
  input: ShiprocketOrderInput
): Promise<ShiprocketOrderResult | null> {
  if (!hasShiprocketConfig()) {
    console.warn("Shiprocket is not configured; skipping order creation.")
    return null
  }

  const kv = await getKVNamespace()
  const headers = await authHeaders(kv)
  const channelId = process.env.SHIPROCKET_CHANNEL_ID || undefined
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary"

  // Step 1: Create order
  const orderPayload = {
    order_id: input.orderId,
    order_date: input.orderDate,
    pickup_location: pickupLocation,
    channel_id: channelId,
    billing_customer_name: input.billingName.split(" ")[0] || input.billingName,
    billing_last_name: input.billingName.split(" ").slice(1).join(" ") || "",
    billing_address: input.billingAddress,
    billing_city: input.billingCity,
    billing_pincode: input.billingPincode,
    billing_state: input.billingState,
    billing_country: "India",
    billing_email: input.billingEmail,
    billing_phone: input.billingPhone.replace(/\D/g, ""),
    shipping_is_billing: true,
    order_items: [
      {
        name: input.productName,
        sku: `BT-${input.productQty}`,
        units: input.productQty,
        selling_price: Math.round(input.productPrice / input.productQty),
        discount: 0,
        tax: 0,
        hsn: "",
      },
    ],
    payment_method: "Prepaid",
    sub_total: input.productPrice,
    length: 30,
    breadth: 20,
    height: 15,
    weight: input.weight,
  }

  const orderResponse = await fetch(`${API_BASE}/orders/create/adhoc`, {
    method: "POST",
    headers,
    body: JSON.stringify(orderPayload),
  })

  if (!orderResponse.ok) {
    const text = await orderResponse.text()
    throw new Error(`Shiprocket order creation failed (${orderResponse.status}): ${text}`)
  }

  const orderData = (await orderResponse.json()) as {
    order_id: number
    shipment_id: number
    status: string
    status_code: number
  }

  // AWB assignment is handled manually in the Shiprocket dashboard.
  // Shiprocket webhooks will push AWB + status updates back to Airtable
  // via /api/webhooks/tracking-updates once the courier is assigned.

  return {
    orderId: orderData.order_id,
    shipmentId: orderData.shipment_id,
    awbCode: null,
    courierName: null,
    status: orderData.status || "NEW",
    pickupRequested: false,
  }
}

/* ─── Track Shipment ─────────────────────────────────────────────────────────── */

/**
 * Fetches tracking info for a shipment by AWB code.
 * Returns null if Shiprocket is not configured or tracking unavailable.
 */
export async function trackShipmentByAwb(
  awbCode: string
): Promise<ShiprocketTrackingResult | null> {
  if (!hasShiprocketConfig()) {
    return null
  }

  const kv = await getKVNamespace()
  const headers = await authHeaders(kv)

  const response = await fetch(
    `${API_BASE}/courier/track/awb/${encodeURIComponent(awbCode)}`,
    { headers, cache: "no-store" }
  )

  if (!response.ok) {
    if (response.status === 404) return null
    const text = await response.text()
    throw new Error(`Shiprocket tracking failed (${response.status}): ${text}`)
  }

  const data = (await response.json()) as {
    tracking_data?: {
      track_status: number
      shipment_status: number
      shipment_track: Array<{
        current_status: string
        delivered_date: string
        etd: string
        courier_name: string
        awb_code: string
      }>
      shipment_track_activities: Array<{
        date: string
        status: string
        activity: string
        location: string
      }>
    }
  }

  const tracking = data.tracking_data
  if (!tracking || !tracking.shipment_track?.length) {
    return null
  }

  const track = tracking.shipment_track[0]!

  return {
    awbCode: track.awb_code || awbCode,
    courierName: track.courier_name || "",
    currentStatus: track.current_status || "Unknown",
    currentStatusDescription: track.current_status || "",
    shipmentStatus: tracking.shipment_status,
    deliveredDate: track.delivered_date || null,
    etd: track.etd || null,
    activities: (tracking.shipment_track_activities || []).map((a) => ({
      date: a.date,
      status: a.status,
      activity: a.activity,
      location: a.location,
    })),
  }
}

/**
 * Fetches tracking info by Shiprocket order ID.
 * Returns null if Shiprocket is not configured or tracking unavailable.
 */
export async function trackShipmentByOrderId(
  shiprocketOrderId: number
): Promise<ShiprocketTrackingResult | null> {
  if (!hasShiprocketConfig()) {
    return null
  }

  const kv = await getKVNamespace()
  const headers = await authHeaders(kv)

  const response = await fetch(
    `${API_BASE}/shipments/${shiprocketOrderId}`,
    { headers, cache: "no-store" }
  )

  if (!response.ok) {
    if (response.status === 404) return null
    const text = await response.text()
    throw new Error(`Shiprocket shipment query failed (${response.status}): ${text}`)
  }

  const data = (await response.json()) as {
    data?: {
      awb_code?: string
    }
  }

  const awb = data.data?.awb_code
  if (!awb) return null

  return trackShipmentByAwb(awb)
}

/* ─── Fetch Order Details ───────────────────────────────────────────────────── */

export type ShiprocketOrderDetails = {
  awbCode: string | null
  courierName: string | null
  status: string
  shipmentId: number | null
}

/**
 * Fetches order details from Shiprocket by their internal order ID.
 * Returns AWB, courier, and status without needing the AWB first.
 */
export async function getShiprocketOrderDetails(
  shiprocketOrderId: number
): Promise<ShiprocketOrderDetails | null> {
  if (!hasShiprocketConfig()) return null

  const kv = await getKVNamespace()
  const headers = await authHeaders(kv)

  const response = await fetch(
    `${API_BASE}/orders/show/${shiprocketOrderId}`,
    { headers, cache: "no-store" }
  )

  if (!response.ok) {
    if (response.status === 404) return null
    const text = await response.text()
    throw new Error(`Shiprocket order fetch failed (${response.status}): ${text}`)
  }

  const raw = await response.json()
  console.log(`Shiprocket order ${shiprocketOrderId} response:`, JSON.stringify(raw).slice(0, 2000))

  const data = raw as {
    data?: {
      status: string
      shipments?: Array<{
        id: number
        awb_code: string
        courier_name: string
        status: string
      }>
    }
  }

  const order = data.data
  if (!order) return null

  const shipment = order.shipments?.[0]
  return {
    awbCode: shipment?.awb_code || null,
    courierName: shipment?.courier_name || null,
    status: shipment?.status || order.status || "NEW",
    shipmentId: shipment?.id || null,
  }
}
