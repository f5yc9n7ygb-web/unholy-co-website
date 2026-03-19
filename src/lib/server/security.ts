import { Buffer } from "node:buffer"
import { NextRequest } from "next/server"

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

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return request.headers.get("cf-connecting-ip")?.trim() || "unknown"
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

export function checkRateLimit(request: NextRequest, options: RateLimitOptions) {
  const now = Date.now()
  const ip = getClientIp(request)
  const key = `${options.bucket}:${ip}`
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
