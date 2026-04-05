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
 * Read the inventory record for a pack.
 * Returns null if the Inventory table isn't set up (graceful skip).
 */
async function getInventoryRecord(packId: string) {
  try {
    const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
    const records = await queryAirtableRecords({
      baseId,
      tableName: INVENTORY_TABLE,
      filterByFormula: `{Pack ID} = "${escapeAirtableValue(packId)}"`,
      maxRecords: 1,
    })
    if (records.length === 0) return null
    const record = records[0]!
    return {
      recordId: record.id,
      stock: Number(record.fields["Stock"] || 0),
      reserved: Number(record.fields["Reserved"] || 0),
    }
  } catch {
    console.warn("Inventory check skipped (table may not exist)")
    return null
  }
}

/**
 * Check if a pack has sufficient stock.
 * Available = Stock - Reserved (accounts for in-progress checkouts).
 * Returns { available: true } if inventory table is missing (graceful skip).
 */
export async function checkStock(packId: string, requiredQty: number): Promise<StockInfo> {
  const inv = await getInventoryRecord(packId)
  if (!inv) {
    return { available: true, stock: -1, recordId: null }
  }
  const effectiveStock = inv.stock - inv.reserved
  return {
    available: effectiveStock >= requiredQty,
    stock: effectiveStock,
    recordId: inv.recordId,
  }
}

/**
 * Reserve stock in Airtable before payment begins.
 * Increments the Reserved column so concurrent checkStock() calls see
 * reduced availability. The reservation is released on payment success
 * (decrementStock) or times out via the cron cleanup.
 *
 * @returns `true` if reservation succeeded, `false` if insufficient stock.
 */
export async function reserveStock(
  packId: string,
  qty: number,
  orderId: string,
  kv?: KVNamespace | null,
): Promise<boolean> {
  const inv = await getInventoryRecord(packId)
  if (!inv) return true // inventory not set up, skip

  const effectiveStock = inv.stock - inv.reserved
  if (effectiveStock < qty) return false

  const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

  // Increment Reserved in Airtable so other checkouts see reduced availability
  await updateAirtableRecord({
    baseId,
    tableName: INVENTORY_TABLE,
    recordId: inv.recordId,
    fields: { Reserved: inv.reserved + qty },
  })

  // Track reservation in KV for cleanup (auto-expires in 15 min)
  if (kv) {
    await kv.put(
      `stock-reserve:${orderId}`,
      JSON.stringify({ packId, qty, recordId: inv.recordId }),
      { expirationTtl: 15 * 60 },
    )
  }

  return true
}

/**
 * Release a stock reservation — decrements the Reserved column.
 * Called on payment failure or abandonment.
 */
export async function releaseStockReservation(
  orderId: string,
  kv?: KVNamespace | null,
): Promise<void> {
  if (!kv) return
  const raw = await kv.get(`stock-reserve:${orderId}`).catch(() => null)
  if (!raw) return

  try {
    const { packId, qty, recordId } = JSON.parse(raw) as {
      packId: string; qty: number; recordId: string
    }
    const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
    const inv = await getInventoryRecord(packId)
    if (inv) {
      await updateAirtableRecord({
        baseId,
        tableName: INVENTORY_TABLE,
        recordId,
        fields: { Reserved: Math.max(0, inv.reserved - qty) },
      })
    }
  } catch (err) {
    console.error("Failed to release stock reservation:", err)
  }

  await kv.put(`stock-reserve:${orderId}`, "", { expirationTtl: 1 }).catch(() => {})
}

/**
 * Decrement stock after successful payment.
 * Decrements Stock AND Reserved (converting the reservation into a sale).
 * Uses optimistic retry with re-read before each write.
 * Silently skips if inventory isn't set up.
 */
const DECREMENT_MAX_RETRIES = 3

export async function decrementStock(packId: string, qty: number, orderId?: string, kv?: KVNamespace | null): Promise<void> {
  for (let attempt = 0; attempt < DECREMENT_MAX_RETRIES; attempt++) {
    try {
      const inv = await getInventoryRecord(packId)
      if (!inv) return

      const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
      const newStock = Math.max(0, inv.stock - qty)
      const newReserved = Math.max(0, inv.reserved - qty)

      await updateAirtableRecord({
        baseId,
        tableName: INVENTORY_TABLE,
        recordId: inv.recordId,
        fields: { Stock: newStock, Reserved: newReserved },
      })

      // Verify write landed (detect concurrent overwrites)
      const verify = await getInventoryRecord(packId)
      if (verify && verify.stock !== newStock) {
        console.warn(`Inventory: write conflict for ${packId} (attempt ${attempt + 1}), retrying...`)
        continue
      }

      // Clean up KV reservation key
      if (orderId && kv) {
        await kv.put(`stock-reserve:${orderId}`, "", { expirationTtl: 1 }).catch(() => {})
      }

      return // success
    } catch (err) {
      if (attempt === DECREMENT_MAX_RETRIES - 1) {
        console.error("Inventory decrement failed after retries:", err)
      }
    }
  }
}
