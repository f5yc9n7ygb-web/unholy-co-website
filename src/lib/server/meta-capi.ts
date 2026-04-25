import { createHash } from "node:crypto"
import type { NextRequest } from "next/server"
import type { MetaAttributionData } from "@/lib/server/order-session"

type CustomerData = {
  email?: string
  phone?: string
  name?: string
  city?: string
  state?: string
  pincode?: string
}

type MetaPurchaseOptions = {
  eventId: string
  value: number
  currency: string
  contentIds: string[]
  contentName: string
  numItems: number
  contents: Array<{ id: string; quantity: number; item_price?: number }>
  customer: CustomerData
  attribution?: MetaAttributionData | null
}

type MetaCapiResponse = {
  events_received?: number
  messages?: string[]
  error?: {
    message?: string
    type?: string
    code?: number
    error_subcode?: number
  }
}

export function getMetaAttributionFromRequest(request: NextRequest): MetaAttributionData {
  const referer = cleanHttpUrl(request.headers.get("referer"))
  const fallbackUrl = getSiteUrl()

  return {
    fbp: cleanMetaCookie(request.cookies.get("_fbp")?.value),
    fbc: cleanMetaCookie(request.cookies.get("_fbc")?.value),
    clientIpAddress: getClientIp(request),
    clientUserAgent: cleanHeader(request.headers.get("user-agent"), 512),
    eventSourceUrl: referer || fallbackUrl,
  }
}

export async function sendMetaPurchaseEvent(options: MetaPurchaseOptions) {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.META_CONVERSIONS_API_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    return { ok: false, skipped: true, reason: "Meta CAPI env vars are not configured." }
  }

  const userData = buildUserData(options.customer, options.attribution)
  if (Object.keys(userData).length === 0) {
    console.warn("Meta CAPI Purchase skipped: no user_data identifiers available.")
    return { ok: false, skipped: true, reason: "No Meta user_data identifiers available." }
  }

  const apiVersion = process.env.META_GRAPH_API_VERSION || "v21.0"
  const endpoint = `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`
  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: options.eventId,
        action_source: "website",
        event_source_url: options.attribution?.eventSourceUrl || `${getSiteUrl()}/thanks`,
        user_data: userData,
        custom_data: {
          value: options.value,
          currency: options.currency,
          content_ids: options.contentIds,
          content_name: options.contentName,
          content_type: "product",
          num_items: options.numItems,
          contents: options.contents,
          order_id: options.eventId,
        },
      },
    ],
  }

  if (process.env.META_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_TEST_EVENT_CODE
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    })
    const result = await response.json().catch(() => null) as MetaCapiResponse | null

    if (!response.ok || result?.error) {
      console.error("Meta CAPI Purchase failed:", {
        status: response.status,
        error: result?.error,
        messages: result?.messages,
      })
      return { ok: false, skipped: false, status: response.status, result }
    }

    return { ok: true, skipped: false, status: response.status, result }
  } catch (error) {
    console.error("Meta CAPI Purchase request failed:", error)
    return { ok: false, skipped: false, error }
  }
}

function buildUserData(customer: CustomerData, attribution?: MetaAttributionData | null) {
  const userData: Record<string, string | string[]> = {}
  const email = normalizeEmail(customer.email)
  const phone = normalizePhone(customer.phone)
  const firstName = normalizeName(customer.name?.split(/\s+/)[0])
  const lastName = normalizeName(customer.name?.split(/\s+/).slice(1).join(" "))
  const city = normalizeName(customer.city)
  const state = normalizeName(customer.state)
  const zip = normalizeZip(customer.pincode)

  if (email) userData.em = [sha256(email)]
  if (phone) userData.ph = [sha256(phone)]
  if (firstName) userData.fn = [sha256(firstName)]
  if (lastName) userData.ln = [sha256(lastName)]
  if (city) userData.ct = [sha256(city)]
  if (state) userData.st = [sha256(state)]
  if (zip) userData.zp = [sha256(zip)]
  userData.country = [sha256("in")]

  if (attribution?.fbp) userData.fbp = attribution.fbp
  if (attribution?.fbc) userData.fbc = attribution.fbc
  if (attribution?.clientIpAddress) userData.client_ip_address = attribution.clientIpAddress
  if (attribution?.clientUserAgent) userData.client_user_agent = attribution.clientUserAgent

  return userData
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || ""
}

function normalizePhone(value?: string) {
  const digits = value?.replace(/\D/g, "") || ""
  if (digits.length === 10) return `91${digits}`
  return digits
}

function normalizeName(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, "") || ""
}

function normalizeZip(value?: string) {
  return value?.replace(/\D/g, "") || ""
}

function cleanMetaCookie(value?: string) {
  if (!value || !value.startsWith("fb.")) return undefined
  return value.slice(0, 256)
}

function cleanHeader(value: string | null, maxLength: number) {
  const cleaned = value?.trim()
  return cleaned ? cleaned.slice(0, maxLength) : undefined
}

function cleanHttpUrl(value: string | null) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined
    return url.toString().slice(0, 2048)
  } catch {
    return undefined
  }
}

function getClientIp(request: NextRequest) {
  return cleanHeader(
    request.headers.get("cf-connecting-ip") ||
      request.headers.get("true-client-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      null,
    128,
  )
}

function getSiteUrl() {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://theunholy.co"
  ).replace(/\/$/, "")
}
