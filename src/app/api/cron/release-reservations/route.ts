import { NextRequest, NextResponse } from "next/server"
import {
  hasAirtableOrdersConfig,
  queryAirtableRecords,
  updateAirtableRecord,
} from "@/lib/server/integrations"
import { isAuthorizedCron } from "@/lib/server/security"
import { releaseStockByPack } from "@/lib/server/inventory"
import {
  getExpiredSupabaseReservations,
  getSupabaseOrdersByStatusesBefore,
  updateSupabaseOrderByRazorpayOrderId,
} from "@/lib/server/supabase"
import { releaseReservation } from "@/lib/server/reservations"
import { releaseExpiredPromoReservations } from "@/lib/shop/promo"

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
    const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID || ""
    const email2Cutoff = new Date(Date.now() - EMAIL_2_RELEASE_AGE_MS).toISOString()
    const pendingCutoff = new Date(Date.now() - PENDING_SAFETY_AGE_MS).toISOString()
    const errors: string[] = []

    const expiredPromos = await releaseExpiredPromoReservations(100).catch((err) => {
      errors.push(`expired promo reservations: ${err?.message || String(err)}`)
      return { found: 0, released: 0 }
    })

    const expiredReservations = await getExpiredSupabaseReservations(100).catch((err) => {
      errors.push(`supabase expired reservations: ${err?.message || String(err)}`)
      return []
    })
    let reservationRowsReleased = 0
    for (const reservation of expiredReservations) {
      const result = await releaseReservation(reservation.reservation_id)
      if (result === "released") reservationRowsReleased++
      if (result === "unavailable") {
        errors.push(`reservation ${reservation.reservation_id}: release unavailable`)
      }
    }

    // pending: created_at > 72h ago (safety net for carts the abandoned-cart cron never processed)
    // email_2_sent: email_2_sent_at > 24h ago (the abandoned-cart cron stamps this column when
    //   it sends email 2 — exact parity with the Airtable "Email 2 Sent At" formula).
    const [pendingSupabaseCarts, email2SupabaseCarts] = await Promise.all([
      getSupabaseOrdersByStatusesBefore(["pending"], pendingCutoff, 50, "created_at").catch((err) => {
        errors.push(`supabase pending stale carts: ${err?.message || String(err)}`)
        return []
      }),
      getSupabaseOrdersByStatusesBefore(["email_2_sent"], email2Cutoff, 50, "email_2_sent_at").catch((err) => {
        errors.push(`supabase email_2_sent stale carts: ${err?.message || String(err)}`)
        return []
      }),
    ])
    const seenOrderIds = new Set<string>()
    const staleSupabaseCarts = [...pendingSupabaseCarts, ...email2SupabaseCarts].filter((cart) => {
      if (seenOrderIds.has(cart.razorpay_order_id)) return false
      seenOrderIds.add(cart.razorpay_order_id)
      return true
    })

    let supabaseCartsExpired = 0
    const releasedSupabaseOrderIds = new Set<string>()
    for (const cart of staleSupabaseCarts) {
      const sourcePayload = cart.source_payload || {}
      const packId = String(sourcePayload.packId || "")
      const qty = Number(cart.quantity || 0)
      if (!packId || qty <= 0) continue

      try {
        const releaseResult = await releaseReservation(cart.razorpay_order_id)
        if (releaseResult === "missing") await releaseStockByPack(packId, qty)
        if (releaseResult === "unavailable") throw new Error("reservation ledger unavailable")
        await updateSupabaseOrderByRazorpayOrderId(cart.razorpay_order_id, { status: "expired" })
        releasedSupabaseOrderIds.add(cart.razorpay_order_id)
        supabaseCartsExpired++
      } catch (err: any) {
        errors.push(`supabase cart ${cart.razorpay_order_id}: ${err?.message || String(err)}`)
      }
    }

    // Normal path: email_2_sent carts given 24h to respond, plus safety net for
    // pending carts the abandoned-cart cron never processed.
    const staleCarts = ordersBaseId && hasAirtableOrdersConfig()
      ? await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName: "Orders",
          filterByFormula: `OR(
            AND({Status} = "email_2_sent", IS_BEFORE({Email 2 Sent At}, "${email2Cutoff}")),
            AND({Status} = "pending", IS_BEFORE({Created At}, "${pendingCutoff}"))
          )`,
          maxRecords: 50,
        }).catch((err) => {
          errors.push(`airtable stale carts: ${err?.message || String(err)}`)
          return [] as Awaited<ReturnType<typeof queryAirtableRecords>>
        })
      : []

    // Aggregate qty to release per pack so we do one Airtable write per SKU.
    // Skip carts the Supabase pass already released (matched on Razorpay Order ID),
    // otherwise a mirrored cart's qty gets subtracted from `reserved` twice.
    const releaseByPack = new Map<string, number>()
    const cartsToExpire: string[] = []
    let supabaseDuplicatesSkipped = 0
    for (const cart of staleCarts) {
      const razorpayOrderId = String(cart.fields["Razorpay Order ID"] || "")
      if (razorpayOrderId && releasedSupabaseOrderIds.has(razorpayOrderId)) {
        // Already handled in the Supabase pass — flip Airtable status so we don't
        // see it again next run, but don't decrement Reserved a second time.
        cartsToExpire.push(cart.id)
        supabaseDuplicatesSkipped++
        continue
      }
      const packId = String(cart.fields["Pack ID"] || "")
      const qty = Number(cart.fields["Quantity"] || 0)
      if (!packId || qty <= 0) continue
      releaseByPack.set(packId, (releaseByPack.get(packId) || 0) + qty)
      cartsToExpire.push(cart.id)
    }

    // Read current Inventory rows and decrement Reserved
    let packsReleased = 0
    for (const [packId, qty] of releaseByPack.entries()) {
      try {
        await releaseStockByPack(packId, qty)
        packsReleased += 1
      } catch (err: any) {
        errors.push(`${packId}: ${err?.message || String(err)}`)
      }
    }

    // Flip expired carts so we don't re-process them next run
    for (const cartId of cartsToExpire) {
      try {
        if (!ordersBaseId || !hasAirtableOrdersConfig()) continue
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
      supabaseCartsExpired,
      supabaseDuplicatesSkipped,
      reservationRowsFound: expiredReservations.length,
      reservationRowsReleased,
      promoReservationRowsFound: expiredPromos.found,
      promoReservationRowsReleased: expiredPromos.released,
      errors,
    })
  } catch (error: any) {
    console.error("release-reservations cron failed:", error?.message || error)
    return NextResponse.json({ ok: false, error: "Cron failed" }, { status: 500 })
  }
}
