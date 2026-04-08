import { NextRequest, NextResponse } from "next/server"
import {
  getRequiredEnv,
  queryAirtableRecords,
  updateAirtableRecord,
} from "@/lib/server/integrations"
import { isAuthorizedCron } from "@/lib/server/security"

/**
 * POST /api/cron/release-reservations
 *
 * Protected by CRON_SECRET bearer token.
 * Should be scheduled every 10 minutes.
 *
 * Releases stock reservations that were claimed by an Orders row but never
 * converted to a payment. Without this, the "Reserved" counter in the
 * Inventory table drifts upward over time because the KV reservation key
 * expires silently after 15 minutes but Airtable is never updated.
 *
 * Safety rules:
 *  - Only releases Orders with Status = "pending" AND Created At > 30 minutes ago
 *  - Converted and payment_failed carts are left untouched
 *  - Marks released carts with Status = "expired" so we don't re-release them
 */
const RELEASE_AGE_MS = 30 * 60 * 1000 // 30 minutes

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
    const cutoff = new Date(Date.now() - RELEASE_AGE_MS).toISOString()

    // Find pending orders older than the cutoff
    const staleCarts = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Orders",
      filterByFormula: `AND({Status} = "pending", IS_BEFORE({Created At}, "${cutoff}"))`,
      maxRecords: 50,
    })

    // Aggregate qty to release per pack so we do one Airtable write per SKU
    const releaseByPack = new Map<string, number>()
    const cartsToExpire: string[] = []
    for (const cart of staleCarts) {
      const packId = String(cart.fields["Pack ID"] || "")
      const qty = Number(cart.fields["Quantity"] || 0)
      if (!packId || qty <= 0) continue
      releaseByPack.set(packId, (releaseByPack.get(packId) || 0) + qty)
      cartsToExpire.push(cart.id)
    }

    // Read current Inventory rows and decrement Reserved
    let packsReleased = 0
    const errors: string[] = []
    for (const [packId, qty] of releaseByPack.entries()) {
      try {
        const inventoryRows = await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName: "Inventory",
          filterByFormula: `{Pack ID} = "${packId.replace(/"/g, '\\"')}"`,
          maxRecords: 1,
        })
        if (inventoryRows.length === 0) continue
        const inv = inventoryRows[0]!
        const currentReserved = Number(inv.fields["Reserved"] || 0)
        const newReserved = Math.max(0, currentReserved - qty)
        await updateAirtableRecord({
          baseId: ordersBaseId,
          tableName: "Inventory",
          recordId: inv.id,
          fields: { Reserved: newReserved },
        })
        packsReleased += 1
      } catch (err: any) {
        errors.push(`${packId}: ${err?.message || String(err)}`)
      }
    }

    // Flip expired carts so we don't re-process them next run
    for (const cartId of cartsToExpire) {
      try {
        await updateAirtableRecord({
          baseId: ordersBaseId,
          tableName: "Orders",
          recordId: cartId,
          fields: { Status: "expired" },
        })
      } catch (err: any) {
        errors.push(`cart ${cartId}: ${err?.message || String(err)}`)
      }
    }

    return NextResponse.json({
      ok: true,
      staleCartsFound: staleCarts.length,
      packsReleased,
      cartsExpired: cartsToExpire.length,
      errors,
    })
  } catch (error: any) {
    console.error("release-reservations cron failed:", error?.message || error)
    return NextResponse.json({ ok: false, error: "Cron failed" }, { status: 500 })
  }
}
