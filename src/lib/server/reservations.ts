import type { KVNamespace } from "@/lib/server/kv"
import {
  getSupabaseReservationById,
  insertSupabaseReservation,
  isSupabaseConfigured,
  restoreConsumedSupabaseReservation,
  transitionSupabaseReservation,
} from "@/lib/server/supabase"
import { releaseStockByPack } from "@/lib/server/inventory"

/**
 * Order-scoped inventory reservation lifecycle (audit P0 #5).
 *
 * Each checkout creates a `reservations` row keyed by its Razorpay order id.
 * Every counter mutation (release on failure/cancel/supersede, settle on pay)
 * is gated by an atomic, only-once status transition, so the held stock for a
 * given order can never be released twice — fixing over-release on retries and
 * the silent leak when superseded carts were marked expired but never released.
 *
 * Gracefully degrades: if the `reservations` table is absent (migration not yet
 * applied) the inserts/transitions no-op and callers fall back to the legacy
 * pack+qty release, so behavior is unchanged until the migration lands.
 */

const DEFAULT_TTL_SECONDS = 20 * 60 // release unpaid holds in ~20 min, not 72h

export async function createReservation(opts: {
  reservationId: string
  razorpayOrderId: string
  packId: string
  quantity: number
  customerEmail?: string
  ttlSeconds?: number
}): Promise<void> {
  await insertSupabaseReservation({
    reservation_id: opts.reservationId,
    razorpay_order_id: opts.razorpayOrderId,
    pack_id: opts.packId,
    quantity: opts.quantity,
    customer_email: opts.customerEmail || null,
    expires_at: new Date(Date.now() + (opts.ttlSeconds ?? DEFAULT_TTL_SECONDS) * 1000).toISOString(),
  }).catch((err) => console.error("createReservation failed:", err))
}

/**
 * Settle a reservation on successful payment (reserved -> consumed). The sale
 * counter itself is applied by decrementStock; this only retires the hold so it
 * can never later be released or expired.
 */
export type ConsumeReservationResult = "consumed" | "already_consumed" | "released" | "expired" | "missing" | "unavailable"

export async function consumeReservation(reservationId: string): Promise<ConsumeReservationResult> {
  if (!isSupabaseConfigured()) return "missing"
  try {
    const consumed = await transitionSupabaseReservation(reservationId, "consumed")
    if (consumed) return "consumed"
    const existing = await getSupabaseReservationById(reservationId)
    if (!existing) return "missing"
    if (existing.status === "consumed") return "already_consumed"
    if (existing.status === "reserved") return "unavailable"
    return existing.status
  } catch (err) {
    console.error(`consumeReservation failed for ${reservationId}:`, err)
    return "unavailable"
  }
}

export async function restoreConsumedReservation(reservationId: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  const restored = await restoreConsumedSupabaseReservation(reservationId)
  if (!restored) throw new Error(`Unable to restore consumed reservation ${reservationId}`)
}

/**
 * Release a reservation's held stock exactly once. The explicit result keeps
 * callers from treating an already-settled row or a database outage as a
 * missing legacy row and releasing the same stock twice.
 */
export type ReleaseReservationResult = "released" | "settled" | "missing" | "unavailable"

export async function releaseReservation(
  reservationId: string,
  kv?: KVNamespace | null,
): Promise<ReleaseReservationResult> {
  if (!isSupabaseConfigured()) return "missing"
  try {
    const won = await transitionSupabaseReservation(reservationId, "released")
    if (won) {
      await releaseStockByPack(won.pack_id, won.quantity, kv)
      return "released"
    }
    return (await getSupabaseReservationById(reservationId)) ? "settled" : "missing"
  } catch (err) {
    console.error(`releaseReservation failed for ${reservationId}:`, err)
    return "unavailable"
  }
}
