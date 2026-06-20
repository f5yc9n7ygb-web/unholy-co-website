/**
 * Promo code validation and discount calculation.
 *
 * Codes are stored in an Airtable "Promo Codes" table with columns:
 *   - Code (single line text, primary) — e.g. "FIRSTBLOOD"
 *   - Discount Type (single select) — "percentage" | "flat"
 *   - Discount Value (number) — e.g. 10 for 10% or 100 for ₹100
 *   - Min Order (number) — minimum order amount to apply (optional)
 *   - Max Uses (number) — total allowed redemptions (0 = unlimited)
 *   - Used Count (number) — current redemption count
 *   - Active (checkbox) — whether the code is active
 *   - Expires At (date) — expiry date (optional)
 *
 * If the table doesn't exist, all codes gracefully fail as "invalid".
 */

import {
  hasAirtableOrdersConfig,
  getRequiredEnv,
  queryAirtableRecords,
  updateAirtableRecord,
} from "@/lib/server/integrations"
import { escapeAirtableValue } from "@/lib/server/security"
import {
  getSupabasePromoCode,
  incrementSupabasePromoUsageAtomic,
  updateSupabasePromoCode,
  reservePromoUsageSupabase,
  linkPromoReservation,
  consumePromoReservationByOrder,
  releasePromoReservationByOrder,
  type SupabasePromoCode,
} from "@/lib/server/supabase"

const PROMO_TABLE = "Promo Codes"

const BUILT_IN_PROMOS: Record<string, Omit<PromoCode, "recordId">> = {
  SINNER: {
    code: "SINNER",
    discountType: "flat",
    discountValue: 66,
    minOrder: 699,
    maxUses: 0,
    usedCount: 0,
    active: true,
    expiresAt: null,
  },
  PLEASE: {
    code: "PLEASE",
    discountType: "flat",
    discountValue: 1,
    minOrder: 0,
    maxUses: 0,
    usedCount: 0,
    active: true,
    expiresAt: null,
  },
  MOMSAIDNO: {
    code: "MOMSAIDNO",
    discountType: "flat",
    discountValue: 13,
    minOrder: 0,
    maxUses: 0,
    usedCount: 0,
    active: true,
    expiresAt: null,
  },
  DAMNED: {
    code: "DAMNED",
    discountType: "flat",
    discountValue: 99,
    minOrder: 1200,
    maxUses: 0,
    usedCount: 0,
    active: true,
    expiresAt: null,
  },
}

export type PromoCode = {
  code: string
  discountType: "percentage" | "flat"
  discountValue: number
  minOrder: number
  maxUses: number
  usedCount: number
  active: boolean
  expiresAt: string | null
  recordId: string
}

export type PromoResult =
  | { valid: true; promo: PromoCode; discountAmount: number; finalPrice: number }
  | { valid: false; error: string }

/**
 * Validate a promo code against an order total.
 */
export async function validatePromoCode(
  code: string,
  orderTotal: number
): Promise<PromoResult> {
  if (!code || typeof code !== "string") {
    return { valid: false, error: "Please enter a promo code." }
  }

  const normalized = code.trim().toUpperCase()
  if (normalized.length < 2 || normalized.length > 30) {
    return { valid: false, error: "Invalid promo code." }
  }

  const builtInPromo = BUILT_IN_PROMOS[normalized]
  if (builtInPromo) {
    return validateResolvedPromo(
      { ...builtInPromo, recordId: `builtin:${normalized}` },
      orderTotal
    )
  }

  try {
    const supabasePromo = await getSupabasePromoCode(normalized)
    if (supabasePromo) {
      return validateResolvedPromo(mapSupabasePromoCode(supabasePromo), orderTotal)
    }
  } catch (err) {
    console.warn("Supabase promo lookup failed, falling back to Airtable:", err)
  }

  try {
    if (!hasAirtableOrdersConfig()) {
      return { valid: false, error: "Invalid promo code." }
    }

    const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

    const records = await queryAirtableRecords({
      baseId,
      tableName: PROMO_TABLE,
      filterByFormula: `{Code} = "${escapeAirtableValue(normalized)}"`,
      maxRecords: 1,
    })

    if (records.length === 0) {
      return { valid: false, error: "Invalid promo code." }
    }

    const record = records[0]!
    const fields = record.fields

    const promo: PromoCode = {
      code: String(fields["Code"] || ""),
      discountType: (String(fields["Discount Type"] || "percentage")) as "percentage" | "flat",
      discountValue: Number(fields["Discount Value"] || 0),
      minOrder: Number(fields["Min Order"] || 0),
      maxUses: Number(fields["Max Uses"] || 0),
      usedCount: Number(fields["Used Count"] || 0),
      active: Boolean(fields["Active"]),
      expiresAt: fields["Expires At"] ? String(fields["Expires At"]) : null,
      recordId: record.id,
    }

    return validateResolvedPromo(promo, orderTotal)
  } catch {
    // Table doesn't exist or query failed
    return { valid: false, error: "Invalid promo code." }
  }
}

/**
 * Increment the usage count after a successful order.
 * Uses optimistic retry to reduce race window on concurrent redemptions.
 */
export async function incrementPromoUsage(recordId: string): Promise<void> {
  if (recordId.startsWith("builtin:")) return

  if (recordId.startsWith("supabase:")) {
    await incrementSupabasePromoUsage(recordId.replace(/^supabase:/, ""))
    return
  }

  const MAX_RETRIES = 3
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

      const records = await queryAirtableRecords({
        baseId,
        tableName: PROMO_TABLE,
        filterByFormula: `RECORD_ID() = "${escapeAirtableValue(recordId)}"`,
        maxRecords: 1,
      })

      if (records.length === 0) return

      const fields = records[0]!.fields
      const current = Number(fields["Used Count"] || 0)
      const maxUses = Number(fields["Max Uses"] || 0)

      // Re-validate usage limit at increment time to catch races from validation→fulfillment gap
      if (maxUses > 0 && current >= maxUses) {
        console.warn(`Promo ${recordId}: usage limit reached at increment (current=${current}, max=${maxUses})`)
        return
      }

      const newCount = current + 1
      await updateAirtableRecord({
        baseId,
        tableName: PROMO_TABLE,
        recordId,
        fields: { "Used Count": newCount },
      })

      // Verify our write landed; retry if a concurrent request overwrote it
      const verifyRecords = await queryAirtableRecords({
        baseId,
        tableName: PROMO_TABLE,
        filterByFormula: `RECORD_ID() = "${escapeAirtableValue(recordId)}"`,
        maxRecords: 1,
      })
      if (verifyRecords.length > 0) {
        const verifiedCount = Number(verifyRecords[0]!.fields["Used Count"] || 0)
        if (verifiedCount !== newCount) {
          console.warn(`Promo ${recordId}: write conflict (attempt ${attempt + 1}), retrying...`)
          continue
        }
      }

      return // success
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        console.error("Promo usage increment failed after retries:", err)
      }
    }
  }
}

// ── Promo usage reservations (audit P0 #6) ───────────────────────────────────
//
// Reserve a slot atomically at order creation so a limited promo can't be
// fanned out across many unpaid discounted orders. Settle on pay, release on
// failure. Built-in/unlimited codes and pre-migration envs are granted without
// tracking (the legacy at-payment increment still caps them).

/** Reserve a promo slot keyed by the order contextId. Returns the decision. */
export async function reservePromoUsage(
  code: string,
  reservationId: string,
): Promise<"granted" | "denied"> {
  if (!code) return "granted"
  const normalized = code.trim().toUpperCase()
  if (BUILT_IN_PROMOS[normalized]) return "granted" // unlimited — no cap to enforce
  const result = await reservePromoUsageSupabase(normalized, reservationId).catch(() => null)
  if (!result) return "granted" // RPC unavailable (pre-migration) — legacy path caps at payment
  return result.granted ? "granted" : "denied"
}

/** Link a reserved promo slot to its Razorpay order id once the order exists. */
export async function linkPromoReservationToOrder(reservationId: string, orderId: string): Promise<void> {
  await linkPromoReservation(reservationId, orderId).catch((err) =>
    console.error("linkPromoReservation failed:", err))
}

/**
 * Settle a promo reservation on successful payment. Returns true if a reserved
 * slot was consumed (caller must NOT also run the legacy increment); false when
 * there was no reservation to consume (built-in/unlimited/pre-migration).
 */
export async function consumePromoReservation(orderId: string): Promise<boolean> {
  return consumePromoReservationByOrder(orderId).catch(() => false)
}

/** Release a promo reservation on failure/cancel/supersede (only-once). */
export async function releasePromoReservation(orderId: string): Promise<boolean> {
  return releasePromoReservationByOrder(orderId).catch(() => false)
}

function calculateDiscount(promo: PromoCode, orderTotal: number): number {
  if (promo.discountType === "percentage") {
    const maxPercent = Math.min(promo.discountValue, 50) // Cap at 50%
    return Math.round((orderTotal * maxPercent) / 100)
  }
  // Flat discount — can't exceed order total
  return Math.min(promo.discountValue, orderTotal)
}


/**
 * Increment the usage count using the promo code directly (used by webhooks).
 */
export async function incrementPromoUsageByCode(code: string): Promise<void> {
  if (!code || typeof code !== "string") return
  
  const normalized = code.trim().toUpperCase()
  if (BUILT_IN_PROMOS[normalized]) return

  try {
    const promo = await getSupabasePromoCode(normalized)
    if (promo) {
      await incrementSupabasePromoUsage(normalized, promo)
      return
    }
  } catch (err) {
    console.warn(`Failed to increment Supabase promo usage for code ${code}: `, err)
  }

  try {
    if (!hasAirtableOrdersConfig()) return
    const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
    const records = await queryAirtableRecords({
      baseId,
      tableName: PROMO_TABLE,
      filterByFormula: `{Code} = "${escapeAirtableValue(normalized)}"`,
      maxRecords: 1,
    })
    
    if (records.length > 0) {
      await incrementPromoUsage(records[0]!.id)
    }
  } catch (err) {
    console.warn(`Failed to increment promo usage for code ${code}: `, err)
  }
}

function validateResolvedPromo(promo: PromoCode, orderTotal: number): PromoResult {
  if (!promo.active) {
    return { valid: false, error: "This promo code is no longer active." }
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { valid: false, error: "This promo code has expired." }
  }

  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return { valid: false, error: "This promo code has reached its usage limit." }
  }

  if (orderTotal < promo.minOrder) {
    return {
      valid: false,
      error: `Minimum order of ₹${promo.minOrder.toLocaleString("en-IN")} required for this code.`,
    }
  }

  const discountAmount = calculateDiscount(promo, orderTotal)
  const finalPrice = Math.max(0, orderTotal - discountAmount)

  return { valid: true, promo, discountAmount, finalPrice }
}

function mapSupabasePromoCode(row: SupabasePromoCode): PromoCode {
  const metadata = row.metadata || {}
  const rawDiscountType = String(row.discount_type || "percentage").toLowerCase()
  const discountType = rawDiscountType === "amount" || rawDiscountType === "flat"
    ? "flat"
    : "percentage"

  return {
    code: row.code,
    discountType,
    discountValue: Number(row.discount_value || 0),
    minOrder: Number(row.min_order ?? metadata.min_order ?? 0),
    maxUses: Number(row.usage_limit || 0),
    usedCount: Number(row.used_count || 0),
    active: Boolean(row.is_active),
    expiresAt: row.ends_at || null,
    recordId: `supabase:${row.code}`,
  }
}

async function incrementSupabasePromoUsage(code: string, _knownPromo?: SupabasePromoCode): Promise<void> {
  // Atomic single-statement increment under a guarded WHERE clause. Concurrent
  // redemptions can't both pass the limit check the way the old read-then-write
  // could.
  const result = await incrementSupabasePromoUsageAtomic(code)
  if (!result) {
    console.warn(`Promo ${code}: row not found in Supabase, increment skipped`)
    return
  }
  if (!result.applied) {
    console.warn(
      `Promo ${code}: increment did not apply (used_count=${result.used_count}, usage_limit=${result.usage_limit ?? "unlimited"}) — likely inactive or at limit`
    )
  }
}
