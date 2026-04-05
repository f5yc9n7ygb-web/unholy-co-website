/**
 * Inventory management via Airtable.
 *
 * Uses an "Inventory" table in the Orders base with columns:
 *   - Pack ID (single line text, primary field) — e.g. "pack6", "pack12", "pack24"
 *   - Stock (number) — current available units
 *   - Reserved (number) — units reserved by in-progress checkouts (optional)
 *   - Low Stock Threshold (number) — alert threshold (optional)
 *
 * Stock is checked before order creation and decremented after payment.
 * If the Inventory table doesn't exist or has no records, stock checks
 * are skipped (graceful degradation — no blocking on missing table).
 */

import {
  getRequiredEnv,
  queryAirtableRecords,
  updateAirtableRecord,
} from "@/lib/server/integrations"
import { escapeAirtableValue } from "@/lib/server/security"
import type { KVNamespace } from "@/lib/server/kv"

const INVENTORY_TABLE = "Inventory"

export type StockInfo = {
  available: boolean
  stock: number
  recordId: string | null
}

/**
 * Check if a pack has sufficient stock.
 * Returns { available: true } if inventory table is missing (graceful skip).
 */
export async function checkStock(packId: string, requiredQty: number): Promise<StockInfo> {
  try {
    const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

    const records = await queryAirtableRecords({
      baseId,
      tableName: INVENTORY_TABLE,
      filterByFormula: `{Pack ID} = "${escapeAirtableValue(packId)}"`,
      maxRecords: 1,
    })

    // No inventory record = unlimited stock (table not set up yet)
    if (records.length === 0) {
      return { available: true, stock: -1, recordId: null }
    }

    const record = records[0]!
    const stock = Number(record.fields["Stock"] || 0)

    return {
      available: stock >= requiredQty,
      stock,
      recordId: record.id,
    }
  } catch {
    // Inventory table doesn't exist or query failed — don't block orders
    console.warn("Inventory check skipped (table may not exist)")
    return { available: true, stock: -1, recordId: null }
  }
}

/**
 * Reserve stock via KV before payment begins.
 * The reservation auto-expires after the TTL so stock isn't permanently locked
 * if the user abandons checkout or the session times out.
 *
 * @returns `true` if reservation succeeded, `false` if insufficient stock.
 */
const RESERVATION_TTL_SECONDS = 15 * 60 // 15 minutes — covers Razorpay payment window

export async function reserveStock(
  packId: string,
  qty: number,
  orderId: string,
  kv?: KVNamespace | null,
): Promise<boolean> {
  const stock = await checkStock(packId, qty)
  if (!stock.available) return false
  if (stock.stock === -1) return true // inventory not set up, skip

  if (kv) {
    // Use KV to track active reservations for this pack
    const reservationKey = `stock-reserve:${orderId}`
    await kv.put(reservationKey, JSON.stringify({ packId, qty }), {
      expirationTtl: RESERVATION_TTL_SECONDS,
    })
  }

  return true
}

/**
 * Release a stock reservation (e.g. on payment failure or timeout).
 */
export async function releaseStockReservation(
  orderId: string,
  kv?: KVNamespace | null,
): Promise<void> {
  if (kv) {
    await kv.put(`stock-reserve:${orderId}`, "", { expirationTtl: 1 }).catch(() => {})
  }
}

/**
 * Decrement stock after successful payment.
 * Uses optimistic retry: re-reads stock before each write attempt to
 * reduce the race window when concurrent orders land.
 * Also cleans up the KV reservation.
 * Silently skips if inventory isn't set up.
 */
const DECREMENT_MAX_RETRIES = 3

export async function decrementStock(packId: string, qty: number, orderId?: string, kv?: KVNamespace | null): Promise<void> {
  // Clean up reservation on successful payment
  if (orderId && kv) {
    await releaseStockReservation(orderId, kv).catch(() => {})
  }

  for (let attempt = 0; attempt < DECREMENT_MAX_RETRIES; attempt++) {
    try {
      const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

      const records = await queryAirtableRecords({
        baseId,
        tableName: INVENTORY_TABLE,
        filterByFormula: `{Pack ID} = "${escapeAirtableValue(packId)}"`,
        maxRecords: 1,
      })

      if (records.length === 0) return

      const record = records[0]!
      const currentStock = Number(record.fields["Stock"] || 0)
      const newStock = Math.max(0, currentStock - qty)

      await updateAirtableRecord({
        baseId,
        tableName: INVENTORY_TABLE,
        recordId: record.id,
        fields: { Stock: newStock },
      })

      // Verify our write landed. If the value differs from what we wrote,
      // another concurrent request read the same stale value and overwrote us
      // (or overwrote the other request). Re-read and retry.
      const verifyRecords = await queryAirtableRecords({
        baseId,
        tableName: INVENTORY_TABLE,
        filterByFormula: `{Pack ID} = "${escapeAirtableValue(packId)}"`,
        maxRecords: 1,
      })

      if (verifyRecords.length > 0) {
        const verifiedStock = Number(verifyRecords[0]!.fields["Stock"] || 0)
        if (verifiedStock !== newStock) {
          console.warn(`Inventory: write conflict for ${packId} (attempt ${attempt + 1}), retrying...`)
          continue
        }
      }

      return // success
    } catch (err) {
      if (attempt === DECREMENT_MAX_RETRIES - 1) {
        console.error("Inventory decrement failed after retries:", err)
      }
    }
  }
}
