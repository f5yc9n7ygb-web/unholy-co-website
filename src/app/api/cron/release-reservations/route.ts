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
 * Status flow (runs AFTER the abandoned-cart email sequence completes, so the
 * two crons don't race each other for the same "pending" records):
 *   pending → email_1_sent → email_2_sent → expired (here)
 *
 * Safety rules:
 *  - Primary target: Status = "email_2_sent" AND Email 2 Sent At > 24h ago
 *    (customer has had email 1 + email 2 + 24h to respond)
 *  - Safety net: Status = "pending" AND Created At > 72h ago
 *    (catches carts the abandoned-cart cron never processed — e.g. if that cron
 *    was down; without this the Reserved counter would drift indefinitely)
 *  - Converted and payment_failed carts are left untouched
 *  - Marks released carts with Status = "expired" so we don't re-release them
 */
const EMAIL_2_RELEASE_AGE_MS = 24 * 60 * 60 * 1000 // 24h after email 2
const PENDING_SAFETY_AGE_MS = 72 * 60 * 60 * 1000  // 72h safety net for pending stragglers

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
    const email2Cutoff = new Date(Date.now() - EMAIL_2_RELEASE_AGE_MS).toISOString()
    const pendingCutoff = new Date(Date.now() - PENDING_SAFETY_AGE_MS).toISOString()

    // Normal path: email_2_sent carts given 24h to respond, plus safety net for
    // pending carts the abandoned-cart cron never processed.
    const staleCarts = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Orders",
      filterByFormula: `OR(
        AND({Status} = "email_2_sent", IS_BEFORE({Email 2 Sent At}, "${email2Cutoff}")),
        AND({Status} = "pending", IS_BEFORE({Created At}, "${pendingCutoff}"))
      )`,
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
