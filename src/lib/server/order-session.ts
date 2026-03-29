import { Buffer } from "node:buffer"
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import type { ShippingForm } from "@/lib/shop/types"
import type { KVNamespace } from "@/lib/server/kv"

type SignedEnvelope<T extends string, P> = {
  type: T
  issuedAt: number
  payload: P
}

type OrderSessionPayload = {
  contextId: string
  orderId: string
  packId: string
  qty: number
  amount: number
  shipping: ShippingForm
  promoCode?: string
  promoRecordId?: string
  discountAmount?: number
}

type ReceiptPayload = {
  packId: string
  qty: number
  orderId?: string
  packTitle?: string
  price?: number
  shippingName?: string
  shippingCity?: string
  shippingState?: string
}

type SubscriptionPayload = {
  email: string
  name?: string
  source: string
}

declare global {
  // eslint-disable-next-line no-var
  var __unholyProcessedPayments: Map<string, number> | undefined
  // eslint-disable-next-line no-var
  var __unholySingleUseStore: Map<string, number> | undefined
}

const processedPayments = globalThis.__unholyProcessedPayments ?? new Map<string, number>()
globalThis.__unholyProcessedPayments = processedPayments
const singleUseStore = globalThis.__unholySingleUseStore ?? new Map<string, number>()
globalThis.__unholySingleUseStore = singleUseStore

export const ORDER_SESSION_COOKIE = "unholy-order-session"

const ORDER_SESSION_TTL_MS = 60 * 60 * 1000
const RECEIPT_TTL_MS = 2 * 60 * 60 * 1000
const PAYMENT_REPLAY_TTL_MS = 24 * 60 * 60 * 1000
const SUBSCRIPTION_TTL_MS = 24 * 60 * 60 * 1000

export function createOrderContextId() {
  return randomBytes(16).toString("hex")
}

export function createOrderReceipt() {
  return `uhc_${randomBytes(6).toString("hex")}`
}

export function createOrderSessionToken(payload: OrderSessionPayload) {
  return signEnvelope<OrderSessionPayload>("order-session", payload)
}

export function readOrderSessionToken(token?: string | null) {
  return verifyEnvelope<"order-session", OrderSessionPayload>(token, "order-session", ORDER_SESSION_TTL_MS)
}

export function createReceiptToken(payload: ReceiptPayload) {
  return signEnvelope<ReceiptPayload>("thanks-receipt", payload)
}

export function readReceiptToken(token?: string | null) {
  return verifyEnvelope<"thanks-receipt", ReceiptPayload>(token, "thanks-receipt", RECEIPT_TTL_MS)
}

export function createSubscriptionToken(payload: SubscriptionPayload) {
  return signEnvelope<SubscriptionPayload>("subscription-opt-in", payload)
}

export function readSubscriptionToken(token?: string | null) {
  return verifyEnvelope<"subscription-opt-in", SubscriptionPayload>(
    token,
    "subscription-opt-in",
    SUBSCRIPTION_TTL_MS
  )
}

/**
 * Idempotency guard for processed payments.
 *
 * Uses Cloudflare KV when available so the guard survives across edge
 * isolates.  Falls back to the in-memory Map for local development.
 *
 * @returns `true` if the payment was claimed (first time), `false` if replay.
 */
export async function claimProcessedPayment(paymentId: string, kv?: KVNamespace | null) {
  const kvKey = `pay:${paymentId}`

  if (kv) {
    const existing = await kv.get(kvKey)
    if (existing) {
      return false
    }
    await kv.put(kvKey, "1", {
      expirationTtl: Math.ceil(PAYMENT_REPLAY_TTL_MS / 1000),
    })
    return true
  }

  // In-memory fallback
  const now = Date.now()
  purgeProcessedPayments(now)

  if (processedPayments.has(paymentId)) {
    return false
  }

  processedPayments.set(paymentId, now + PAYMENT_REPLAY_TTL_MS)
  return true
}

/**
 * Idempotency guard for single-use keys (e.g. subscription double-submit).
 *
 * Uses Cloudflare KV when available, falls back to in-memory Map.
 */
export async function claimSingleUseKey(
  scope: string,
  key: string,
  kv?: KVNamespace | null,
  ttlMs = SUBSCRIPTION_TTL_MS,
) {
  const compositeKey = `${scope}:${key}`
  const kvKey = `su:${compositeKey}`

  if (kv) {
    const existing = await kv.get(kvKey)
    if (existing) {
      return false
    }
    await kv.put(kvKey, "1", {
      expirationTtl: Math.ceil(ttlMs / 1000),
    })
    return true
  }

  // In-memory fallback
  const now = Date.now()
  purgeSingleUseKeys(now)

  if (singleUseStore.has(compositeKey)) {
    return false
  }

  singleUseStore.set(compositeKey, now + ttlMs)
  return true
}

function signEnvelope<P>(type: string, payload: P) {
  const envelope: SignedEnvelope<string, P> = {
    type,
    issuedAt: Date.now(),
    payload,
  }

  const encoded = encodeBase64Url(JSON.stringify(envelope))
  const signature = signValue(encoded)
  return `${encoded}.${signature}`
}

function verifyEnvelope<T extends string, P>(token: string | null | undefined, expectedType: T, ttlMs: number) {
  if (!token) {
    return null
  }

  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) {
    return null
  }

  const expectedSignature = signValue(encoded)
  const expectedBuffer = Uint8Array.from(Buffer.from(expectedSignature))
  const actualBuffer = Uint8Array.from(Buffer.from(signature))
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encoded)) as SignedEnvelope<T, P>
    if (parsed.type !== expectedType) {
      return null
    }

    if (Date.now() - parsed.issuedAt > ttlMs) {
      return null
    }

    return parsed.payload
  } catch {
    return null
  }
}

function signValue(value: string) {
  return createHmac("sha256", getSigningSecret()).update(value).digest("base64url")
}

/**
 * Returns the dedicated signing secret.
 *
 * IMPORTANT: We no longer fall back to `RAZORPAY_KEY_SECRET` because mixing a
 * payment provider key with general-purpose HMAC signing is a security
 * anti-pattern (rotating one would silently break the other).
 */
function getSigningSecret() {
  const secret = process.env.SECURITY_SIGNING_SECRET
  if (!secret) {
    throw new Error(
      "SECURITY_SIGNING_SECRET is not configured. " +
        "Generate one with: openssl rand -base64 32"
    )
  }

  return secret
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url")
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function purgeProcessedPayments(now: number) {
  for (const [key, expiresAt] of processedPayments.entries()) {
    if (expiresAt <= now) {
      processedPayments.delete(key)
    }
  }
}

function purgeSingleUseKeys(now: number) {
  for (const [key, expiresAt] of singleUseStore.entries()) {
    if (expiresAt <= now) {
      singleUseStore.delete(key)
    }
  }
}
