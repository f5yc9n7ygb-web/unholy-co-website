import { NextRequest, NextResponse } from "next/server"
import { INDIAN_STATES_AND_UNION_TERRITORIES } from "@/lib/shop/checkout-validation"
import { getKVNamespace } from "@/lib/server/kv"
import { checkRateLimit } from "@/lib/server/security"

const PINCODE_REGEX = /^\d{6}$/
const INDIA_POST_ENDPOINT = "https://api.postalpincode.in/pincode"

const STATE_ALIASES: Record<string, string> = {
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  chattisgarh: "Chhattisgarh",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra & nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra & nagar haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "jammu & kashmir": "Jammu and Kashmir",
  nct: "Delhi",
  "nct of delhi": "Delhi",
  orissa: "Odisha",
  pondicherry: "Puducherry",
  tamilnadu: "Tamil Nadu",
  uttaranchal: "Uttarakhand",
}

const STATE_BY_KEY = new Map(
  INDIAN_STATES_AND_UNION_TERRITORIES.map((state) => [state.toLowerCase(), state])
)

type IndiaPostOffice = {
  Name?: string
  District?: string
  State?: string
  DeliveryStatus?: string
}

type IndiaPostResponse = {
  Status?: string
  PostOffice?: IndiaPostOffice[] | null
}

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get("pincode")?.trim()

  if (!pincode || !PINCODE_REGEX.test(pincode)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid 6-digit pincode." },
      { status: 400 }
    )
  }

  const kv = await getKVNamespace()
  const rateLimit = await checkRateLimit(request, {
    bucket: "pincode-lookup",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  }, kv)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many pincode lookups. Enter city and state manually." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  try {
    const res = await fetch(`${INDIA_POST_ENDPOINT}/${pincode}`, {
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(4000),
    })
    const data = (await res.json()) as IndiaPostResponse[]
    const result = Array.isArray(data) ? data[0] : null
    const postOffices = result?.PostOffice || []

    if (!res.ok || result?.Status !== "Success" || postOffices.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Pincode not found. Enter city and state manually." },
        { status: 404 }
      )
    }

    const primary =
      postOffices.find((office) => office.DeliveryStatus === "Delivery") ||
      postOffices[0]
    const city = sanitizeLocation(primary?.District || primary?.Name || "")
    const state = normalizeState(primary?.State || "")

    if (!city || !state) {
      return NextResponse.json(
        { ok: false, error: "Pincode lookup is incomplete. Enter city and state manually." },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, pincode, city, state })
  } catch {
    return NextResponse.json(
      { ok: false, error: "Pincode lookup failed. Enter city and state manually." },
      { status: 502 }
    )
  }
}

function sanitizeLocation(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80)
}

function normalizeState(value: string) {
  const clean = sanitizeLocation(value)
  const key = clean.toLowerCase()
  return STATE_BY_KEY.get(key) || STATE_ALIASES[key] || ""
}
