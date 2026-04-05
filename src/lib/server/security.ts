import { Buffer } from "node:buffer"
import { timingSafeEqual } from "node:crypto"
import { NextRequest } from "next/server"
import type { KVNamespace } from "@/lib/server/kv"

type RateLimitOptions = {
  bucket: string
  limit: number
  windowMs: number
}

type RateLimitRecord = {
  count: number
  resetAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var __unholyRateLimitStore: Map<string, RateLimitRecord> | undefined
}

const rateLimitStore = globalThis.__unholyRateLimitStore ?? new Map<string, RateLimitRecord>()
globalThis.__unholyRateLimitStore = rateLimitStore

export const FORM_BODY_LIMIT_BYTES = 16 * 1024
export const ORDER_BODY_LIMIT_BYTES = 24 * 1024

/**
 * Returns the most-trustworthy client IP address.
 *
 * On Cloudflare, `cf-connecting-ip` is set by the edge and cannot be spoofed
 * by the client, so we check it first.  `x-forwarded-for` is a fallback for
 * non-Cloudflare environments (local dev, other proxies).
 */
export function getClientIp(request: NextRequest) {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim()
  if (cfIp) {
    return cfIp
  }

  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return "unknown"
}

export function validateRequestOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")?.trim()
  if (!origin) {
    return { ok: false as const, message: "Origin header is required." }
  }

  const allowedOrigins = new Set(
    [request.nextUrl.origin, process.env.PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_SITE_URL]
      .filter(Boolean)
      .map((value) => normalizeOrigin(String(value)))
  )

  if (!allowedOrigins.has(normalizeOrigin(origin))) {
    return { ok: false as const, message: "Origin is not allowed." }
  }

  return { ok: true as const }
}

export function validateContentLength(request: NextRequest, maxBytes: number) {
  const contentLengthHeader = request.headers.get("content-length")
  if (!contentLengthHeader) {
    return { ok: true as const }
  }

  const contentLength = Number(contentLengthHeader)
  if (!Number.isFinite(contentLength) || contentLength < 0) {
    return { ok: false as const, message: "Invalid content length." }
  }

  if (contentLength > maxBytes) {
    return { ok: false as const, message: "Payload too large." }
  }

  return { ok: true as const }
}

/**
 * Rate-limiter that uses Cloudflare KV when available and falls back to an
 * in-memory Map for local development.
 *
 * @param kv  - pass the KVNamespace from `getKVNamespace()`, or `null`.
 */
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
  kv?: KVNamespace | null,
) {
  const now = Date.now()
  const ip = getClientIp(request)
  const key = `${options.bucket}:${ip}`

  // ── KV-backed path ──────────────────────────────────────────────────────────
  if (kv) {
    const raw = await kv.get(`rl:${key}`)
    const existing: RateLimitRecord | null = raw ? JSON.parse(raw) : null

    if (!existing || existing.resetAt <= now) {
      const record: RateLimitRecord = { count: 1, resetAt: now + options.windowMs }
      await kv.put(`rl:${key}`, JSON.stringify(record), {
        expirationTtl: Math.ceil(options.windowMs / 1000) + 60,
      })
      return {
        ok: true as const,
        remaining: options.limit - 1,
        retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      }
    }

    if (existing.count >= options.limit) {
      return {
        ok: false as const,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      }
    }

    existing.count += 1
    await kv.put(`rl:${key}`, JSON.stringify(existing), {
      expirationTtl: Math.ceil((existing.resetAt - now) / 1000) + 60,
    })

    return {
      ok: true as const,
      remaining: options.limit - existing.count,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  // ── In-memory fallback (local dev) ──────────────────────────────────────────
  const existing = rateLimitStore.get(key)

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs })
    purgeExpiredRateLimits(now)
    return {
      ok: true as const,
      remaining: options.limit - 1,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    }
  }

  if (existing.count >= options.limit) {
    return {
      ok: false as const,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  rateLimitStore.set(key, existing)

  return {
    ok: true as const,
    remaining: options.limit - existing.count,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function sanitizeText(value: unknown, maxLength: number) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength)
}

export function sanitizeMultilineText(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, maxLength)
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Escape a value for safe interpolation into an Airtable filterByFormula string.
 * Prevents formula injection by escaping backslashes and double quotes.
 */
export function escapeAirtableValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

export function hasFilledHoneypot(payload: Record<string, string>) {
  return Boolean(payload.company || payload.website)
}

export function parseJsonBody<T>(body: string, maxBytes: number): T {
  if (Buffer.byteLength(body) > maxBytes) {
    throw new Error("Payload too large.")
  }

  const parsed = JSON.parse(body)
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid JSON payload.")
  }

  return parsed as T
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, "")
}

function purgeExpiredRateLimits(now: number) {
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Timing-safe verification of CRON_SECRET bearer token.
 * Prevents timing attacks that could leak the secret via response-time analysis.
 */
export function isAuthorizedCron(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false

  const authHeader = request.headers.get("authorization")
  if (!authHeader) return false

  const prefix = "Bearer "
  if (!authHeader.startsWith(prefix)) return false

  const token = authHeader.slice(prefix.length)
  if (token.length !== expected.length) return false

  const tokenBuf = Uint8Array.from(Buffer.from(token))
  const expectedBuf = Uint8Array.from(Buffer.from(expected))
  return timingSafeEqual(tokenBuf, expectedBuf)
}
