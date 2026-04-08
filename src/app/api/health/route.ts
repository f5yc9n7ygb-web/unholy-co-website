import { NextResponse } from "next/server"

/**
 * GET /api/health
 *
 * Unauthenticated liveness probe for uptime monitoring (Cloudflare, Better
 * Uptime, etc.). Intentionally does NOT touch Airtable, KV, or any third-party
 * API so it can't false-alarm due to upstream hiccups — use a separate deep
 * health check if you need that.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "unholy-co-website",
      timestamp: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  )
}
