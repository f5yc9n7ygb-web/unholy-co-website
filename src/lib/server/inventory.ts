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
  hasAirtableOrdersConfig,
  getRequiredEnv,
  queryAirtableRecords,
  updateAirtableRecord,
} from "@/lib/server/integrations"
import {
  getSupabaseInventory,
  updateSupabaseInventory,
} from "@/lib/server/supabase"
import { escapeAirtableValue } from "@/lib/server/security"
import { isSpecialPackId } from "@/lib/shop/catalog"
import type { KVNamespace } from "@/lib/server/kv"

const INVENTORY_TABLE = "Inventory"

export type StockInfo = {
  available: boolean
  stock: number
  recordId: string | null
}

/**
 * Distributed mutex for inventory mutations.
 *
 * Cloudflare KV has no native CAS, so this uses a put-then-verify pattern:
 * write our token, re-read, and only proceed if our token won. The TTL uses
 * Cloudflare KV's 60s minimum so a crashed worker cannot hold it indefinitely.
 *
 * Under very high contention (1000+ concurrent drops) a true Durable Object
 * is better, but this closes the ~500ms read-modify-write race window that
 * caused overselling in practice.
 */
async function withInventoryLock<T>(
  packId: string,
  kv: KVNamespace | null | undefined,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!kv) return fn() // local dev — no distributed lock available
  const lockKey = `inv-lock:${packId}`
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  let acquired = false
  for (let attempt = 0; attempt < 15; attempt++) {
    const existing = await kv.get(lockKey)
    if (!existing) {
      await kv.put(lockKey, token, { expirationTtl: 60 })
      const verify = await kv.get(lockKey)
      if (verify === token) {
        acquired = true
        break
      }
    }
    await new Promise((r) => setTimeout(r, 80 + attempt * 40))
  }

  if (!acquired) {
    console.warn(`Inventory: could not acquire lock for ${packId}, rejecting`)
    return fallback
  }

  try {
    return await fn()
  } finally {
    try {
      const current = await kv.get(lockKey)
      if (current === token) await kv.delete(lockKey)
    } catch {
      // ignore
    }
  }
}

/**
 * Read the inventory record for a pack.
 * Returns null if the Inventory table isn't set up (graceful skip).
 */
async function getInventoryRecord(packId: string) {
  try {
    const inv = await getSupabaseInventory(packId)
    if (inv) {
      return {
        source: "supabase" as const,
        recordId: packId,
        stock: Number(inv.available || 0),
        reserved: Number(inv.reserved || 0),
        sold: Number(inv.sold || 0),
      }
    }
  } catch (err) {
    console.warn("Supabase inventory check failed, falling back to Airtable:", err)
  }

  try {
    if (!hasAirtableOrdersConfig()) return null
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
      source: "airtable" as const,
      recordId: record.id,
      stock: Number(record.fields["Stock"] || 0),
      reserved: Number(record.fields["Reserved"] || 0),
      sold: Number(record.fields["Sold"] || 0),
    }
  } catch {
    console.warn("Inventory check skipped (table may not exist)")
    return null
  }
}

/**
 * Patch the Airtable Inventory row for a pack. If the user's Airtable schema
 * doesn't have the `Sold` column the first PATCH 422s — retry without `Sold`
 * so Stock/Reserved still land. Quietly returns when the row doesn't exist
 * (graceful skip for envs that haven't seeded the table).
 */
async function patchAirtableInventoryRow(
  baseId: string,
  recordId: string,
  fields: Record<string, number | string | boolean>,
) {
  try {
    await updateAirtableRecord({
      baseId,
      tableName: INVENTORY_TABLE,
      recordId,
      fields,
    })
  } catch (err: any) {
    const message = String(err?.message || err || "")
    const isUnknownSold = "Sold" in fields && (
      message.includes("UNKNOWN_FIELD_NAME") ||
      (message.includes("422") && message.includes("Sold"))
    )
    if (!isUnknownSold) throw err
    const { Sold: _Sold, ...withoutSold } = fields
    await updateAirtableRecord({
      baseId,
      tableName: INVENTORY_TABLE,
      recordId,
      fields: withoutSold,
    })
  }
}

async function updateAirtableInventoryMirror(packId: string, fields: Record<string, number | string | boolean>) {
  if (!hasAirtableOrdersConfig()) return

  try {
    const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
    const records = await queryAirtableRecords({
      baseId,
      tableName: INVENTORY_TABLE,
      filterByFormula: `{Pack ID} = "${escapeAirtableValue(packId)}"`,
      maxRecords: 1,
    })
    const record = records[0]
    if (!record) return

    await patchAirtableInventoryRow(baseId, record.id, fields)
  } catch (err) {
    console.error(`Inventory Airtable mirror update failed for ${packId}:`, err)
  }
}

/**
 * Check if a pack has sufficient stock.
 * Available = Stock - Reserved (accounts for in-progress checkouts).
 * Returns { available: true } if inventory table is missing (graceful skip).
 * Special/stunt SKUs fail closed because they are intentionally scarce and
 * easy to forget when seeding inventory.
 */
export async function checkStock(packId: string, requiredQty: number): Promise<StockInfo> {
  const inv = await getInventoryRecord(packId)
  if (!inv) {
    return { available: !isSpecialPackId(packId), stock: -1, recordId: null }
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
  return withInventoryLock(packId, kv, async () => {
    try {
      const inv = await getInventoryRecord(packId)
      if (!inv) return !isSpecialPackId(packId) // normal SKUs degrade open; stunt SKUs require seeded stock

      const effectiveStock = inv.stock - inv.reserved
      if (effectiveStock < qty) return false

      const newReserved = inv.reserved + qty

      if (inv.source === "supabase") {
        await updateSupabaseInventory(packId, { reserved: newReserved })
        await updateAirtableInventoryMirror(packId, { Reserved: newReserved })
      } else {
        const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
        await updateAirtableRecord({
          baseId,
          tableName: INVENTORY_TABLE,
          recordId: inv.recordId,
          fields: { Reserved: newReserved },
        })
      }

      // Track reservation in KV for cleanup (auto-expires in 15 min)
      if (kv) {
        await kv.put(
          `stock-reserve:${orderId}`,
          JSON.stringify({ packId, qty, recordId: inv.recordId, source: inv.source }),
          { expirationTtl: 15 * 60 },
        )
      }

      return true
    } catch (err) {
      console.error("Inventory reservation failed:", err)
      return false
    }
  }, false)
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

  const { packId, qty, recordId, source } = JSON.parse(raw) as {
    packId: string; qty: number; recordId: string; source?: "supabase" | "airtable"
  }

  await withInventoryLock(packId, kv, async () => {
    try {
      const inv = await getInventoryRecord(packId)
      if (!inv) return
      const newReserved = Math.max(0, inv.reserved - qty)
      if ((source || inv.source) === "supabase") {
        await updateSupabaseInventory(packId, { reserved: newReserved })
        await updateAirtableInventoryMirror(packId, { Reserved: newReserved })
      } else {
        const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
        await updateAirtableRecord({
          baseId,
          tableName: INVENTORY_TABLE,
          recordId,
          fields: { Reserved: newReserved },
        })
      }
    } catch (err) {
      console.error("Failed to release stock reservation:", err)
    }
  }, undefined)

  await kv.delete(`stock-reserve:${orderId}`).catch(() => {})
}

/**
 * Release reserved stock when the reservation key is not known anymore.
 * Used by payment-failed webhooks and stale-cart cleanup during the migration.
 */
export async function releaseStockByPack(
  packId: string,
  qty: number,
  kv?: KVNamespace | null,
): Promise<void> {
  if (!packId || qty <= 0) return

  await withInventoryLock(packId, kv, async () => {
    try {
      const inv = await getInventoryRecord(packId)
      if (!inv) return

      const newReserved = Math.max(0, inv.reserved - qty)
      if (inv.source === "supabase") {
        await updateSupabaseInventory(packId, { reserved: newReserved })
        await updateAirtableInventoryMirror(packId, { Reserved: newReserved })
      } else {
        const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
        await updateAirtableRecord({
          baseId,
          tableName: INVENTORY_TABLE,
          recordId: inv.recordId,
          fields: { Reserved: newReserved },
        })
      }
    } catch (err) {
      console.error("Failed to release stock by pack:", err)
    }
  }, undefined)
}

/**
 * Decrement stock after successful payment.
 * Decrements Stock AND Reserved (converting the reservation into a sale).
 * Uses optimistic retry with re-read before each write.
 * Silently skips if inventory isn't set up.
 */
export async function decrementStock(packId: string, qty: number, orderId?: string, kv?: KVNamespace | null): Promise<void> {
  const completed = await withInventoryLock(packId, kv, async () => {
      const inv = await getInventoryRecord(packId)
      if (!inv) return true

      const newStock = Math.max(0, inv.stock - qty)
      const newReserved = Math.max(0, inv.reserved - qty)
      const newSold = Math.max(0, inv.sold + qty)
      if (inv.stock - qty < 0) {
        // Oversell detected — log loudly so ops can reconcile
        console.error(`Inventory OVERSELL: ${packId} qty=${qty} stock=${inv.stock}`)
      }

      if (inv.source === "supabase") {
        await updateSupabaseInventory(packId, {
          available: newStock,
          reserved: newReserved,
          sold: newSold,
        })
        await updateAirtableInventoryMirror(packId, {
          Stock: newStock,
          Reserved: newReserved,
          Sold: newSold,
        })
      } else {
        const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
        await patchAirtableInventoryRow(baseId, inv.recordId, {
          Stock: newStock,
          Reserved: newReserved,
          Sold: newSold,
        })
      }

      if (orderId && kv) {
        await kv.delete(`stock-reserve:${orderId}`).catch(() => {})
      }
      return true
  }, false)
  if (!completed) throw new Error(`Inventory lock unavailable for ${packId}`)
}
