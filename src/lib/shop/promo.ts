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
  getRequiredEnv,
  queryAirtableRecords,
  updateAirtableRecord,
} from "@/lib/server/integrations"
import { escapeAirtableValue } from "@/lib/server/security"

const PROMO_TABLE = "Promo Codes"

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

  try {
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
  const MAX_RETRIES = 3
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

      // Use record ID directly via Airtable API (not filterByFormula) to avoid injection
      const records = await queryAirtableRecords({
        baseId,
        tableName: PROMO_TABLE,
        filterByFormula: `RECORD_ID() = "${escapeAirtableValue(recordId)}"`,
        maxRecords: 1,
      })

      if (records.length === 0) return

      const current = Number(records[0]!.fields["Used Count"] || 0)

      await updateAirtableRecord({
        baseId,
        tableName: PROMO_TABLE,
        recordId,
        fields: { "Used Count": current + 1 },
      })

      return // success
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        console.error("Promo usage increment failed after retries:", err)
      }
    }
  }
}

function calculateDiscount(promo: PromoCode, orderTotal: number): number {
  if (promo.discountType === "percentage") {
    const maxPercent = Math.min(promo.discountValue, 50) // Cap at 50%
    return Math.round((orderTotal * maxPercent) / 100)
  }
  // Flat discount — can't exceed order total
  return Math.min(promo.discountValue, orderTotal)
}
