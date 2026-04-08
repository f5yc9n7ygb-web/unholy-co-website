import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/server/security"
import { getKVNamespace } from "@/lib/server/kv"

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/

export async function GET(request: NextRequest) {
  const gstin = request.nextUrl.searchParams.get("gstin")?.trim().toUpperCase()

  if (!gstin || !GSTIN_REGEX.test(gstin)) {
    return NextResponse.json({ ok: false, error: "Invalid GSTIN format." }, { status: 400 })
  }

  const kv = await getKVNamespace()
  const rateLimit = await checkRateLimit(request, {
    bucket: "gst-verify",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  }, kv)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many lookups. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  const apiKey = process.env.APPYFLOW_GST_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "GST verification is not configured." }, { status: 503 })
  }

  try {
    // POST with body so the API key never appears in URLs, referrers, or access logs
    const res = await fetch("https://appyflow.in/api/verifyGST", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ gstNo: gstin, key_secret: apiKey }).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()

    if (data.error || !data.taxpayerInfo) {
      return NextResponse.json({ ok: false, error: "GSTIN not found or invalid." }, { status: 404 })
    }

    const info = data.taxpayerInfo
    return NextResponse.json({
      ok: true,
      gstin: info.gstin,
      legalName: info.lgnm || "",
      tradeName: info.tradeNam || "",
      status: info.sts || "",
      type: info.ctb || "",
    })
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to verify GSTIN right now." }, { status: 502 })
  }
}
