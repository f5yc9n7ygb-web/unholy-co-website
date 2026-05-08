import { NextRequest, NextResponse } from "next/server"
import {
  hasAirtableOrdersConfig,
  queryAirtableRecords,
  updateAirtableRecord,
  sendAbandonedCartEmail1,
  sendAbandonedCartEmail2,
} from "@/lib/server/integrations"
import { escapeAirtableValue, isAuthorizedCron } from "@/lib/server/security"
import { getKVNamespace, type KVNamespace } from "@/lib/server/kv"
import {
  getSupabaseOrdersByStatusesBefore,
  hasSupabaseConvertedOrderForEmail,
  updateSupabaseOrderByRazorpayOrderId,
} from "@/lib/server/supabase"

// 14-day TTL: well past the 24h email-2 cadence, short enough to free the slot
// once the cart is genuinely dead.
const SEND_DEDUP_TTL_SEC = 14 * 24 * 60 * 60

/**
 * Claim a KV slot before sending an abandoned-cart email so a status-update
 * failure (Airtable / Supabase outage between send and persist) doesn't cause
 * the next sweep to re-send. Returns false if the slot is already claimed.
 */
async function claimSendDedup(
  kv: KVNamespace | null,
  stage: 1 | 2,
  cartKey: string,
): Promise<boolean> {
  if (!kv || !cartKey) return true
  const key = `ac:em${stage}:${cartKey}`
  const existing = await kv.get(key)
  if (existing) return false
  await kv.put(key, "1", { expirationTtl: SEND_DEDUP_TTL_SEC })
  return true
}

const ABANDONED_THRESHOLD_MS = 30 * 60 * 1000      // 30 minutes
const EMAIL_2_DELAY_MS = 24 * 60 * 60 * 1000       // 24 hours after email 1

/**
 * Safety net: before emailing a cart, check whether the customer already
 * converted on a different order. If so, skip the email and quietly mark the
 * cart expired so future sweeps ignore it. Guards against the case where the
 * supersede path didn't fire at conversion time and prevents emailing a
 * customer who has already paid.
 */
async function hasCustomerAlreadyConverted(
  ordersBaseId: string,
  customerEmail: string,
): Promise<boolean> {
  if (!customerEmail) return false

  const supabaseConverted = await hasSupabaseConvertedOrderForEmail(customerEmail).catch(() => false)
  if (supabaseConverted) return true

  if (!ordersBaseId || !hasAirtableOrdersConfig()) return false
  const emailEsc = escapeAirtableValue(customerEmail)
  const converted = await queryAirtableRecords({
    baseId: ordersBaseId,
    tableName: "Orders",
    filterByFormula: `AND(LOWER({Customer Email}) = LOWER("${emailEsc}"), {Status} = "converted")`,
    maxRecords: 1,
  }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)
  return converted.length > 0
}

/**
 * POST /api/cron/abandoned-cart
 *
 * Protected by CRON_SECRET bearer token.
 * Called every 15 minutes by a Cloudflare Worker cron trigger.
 *
 * 1. Finds "pending" carts older than 30 min → sends email 1
 * 2. Finds "email_1_sent" carts where email 1 was sent >24h ago → sends email 2
 *
 * Supabase is the primary store; the Airtable Orders table is mirrored during
 * migration. Each row identified in either store is processed once (deduped by
 * Razorpay order ID).
 */
export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID || ""
  const tableName = "Orders"
  const now = new Date()
  const kv = await getKVNamespace()

  let email1Sent = 0
  let email2Sent = 0
  const errors: string[] = []

  type CartTarget = {
    orderId: string
    customerEmail: string
    customerName: string
    packTitle: string
    packQty: number
    packPrice: number
    promoCode?: string
    discountAmount?: number
    airtableRecordId?: string
  }

  function mapSupabaseCart(cart: NonNullable<Awaited<ReturnType<typeof getSupabaseOrdersByStatusesBefore>>[number]>): CartTarget {
    const sourcePayload = (cart.source_payload || {}) as Record<string, unknown>
    return {
      orderId: cart.razorpay_order_id,
      customerEmail: String(cart.customer_email || ""),
      customerName: String(cart.customer_name || "Sinner"),
      packTitle: String(cart.pack || "BloodThirst"),
      packQty: Number(cart.quantity || 0),
      packPrice: Number(sourcePayload.price || cart.amount || 0),
      promoCode: String(sourcePayload.promoCode || "") || undefined,
      discountAmount: Number(sourcePayload.discountAmount || 0) || undefined,
    }
  }

  function mapAirtableCart(record: { id: string; fields: Record<string, unknown> }): CartTarget {
    const f = record.fields
    return {
      orderId: String(f["Razorpay Order ID"] || ""),
      customerEmail: String(f["Customer Email"] || ""),
      customerName: String(f["Customer Name"] || "Sinner"),
      packTitle: String(f["Pack"] || "BloodThirst"),
      packQty: Number(f["Quantity"] || 0),
      packPrice: Number(f["Price"] || 0),
      promoCode: String(f["Promo Code"] || "") || undefined,
      discountAmount: Number(f["Discount Amount"] || 0) || undefined,
      airtableRecordId: record.id,
    }
  }

  async function expireCart(target: CartTarget) {
    if (target.orderId) {
      await updateSupabaseOrderByRazorpayOrderId(target.orderId, { status: "expired" })
        .catch((err) => console.error(`Supabase expire ${target.orderId} failed:`, err))
    }
    if (target.airtableRecordId && ordersBaseId && hasAirtableOrdersConfig()) {
      await updateAirtableRecord({
        baseId: ordersBaseId,
        tableName,
        recordId: target.airtableRecordId,
        fields: { Status: "expired" },
      }).catch((err) => console.error(`Airtable expire ${target.airtableRecordId} failed:`, err))
    }
  }

  async function markEmailSent(target: CartTarget, stage: 1 | 2) {
    const isoNow = now.toISOString()
    const dateOnly = isoNow.split("T")[0]!
    const supabasePatch = stage === 1
      ? { status: "email_1_sent", email_1_sent_at: isoNow }
      : { status: "email_2_sent", email_2_sent_at: isoNow }
    if (target.orderId) {
      await updateSupabaseOrderByRazorpayOrderId(target.orderId, supabasePatch)
        .catch((err) => console.error(`Supabase email${stage}_sent update for ${target.orderId} failed:`, err))
    }
    if (target.airtableRecordId && ordersBaseId && hasAirtableOrdersConfig()) {
      const airtablePatch = stage === 1
        ? { Status: "email_1_sent", "Email 1 Sent At": dateOnly }
        : { Status: "email_2_sent", "Email 2 Sent At": dateOnly }
      await updateAirtableRecord({
        baseId: ordersBaseId,
        tableName,
        recordId: target.airtableRecordId,
        fields: airtablePatch,
      }).catch((err) => console.error(`Airtable email${stage}_sent update for ${target.airtableRecordId} failed:`, err))
    }
  }

  // ── Email 1: pending carts older than 30 minutes ──
  try {
    const cutoff = new Date(now.getTime() - ABANDONED_THRESHOLD_MS).toISOString()

    const supabasePending = await getSupabaseOrdersByStatusesBefore(["pending"], cutoff, 50, "created_at")
      .catch((err) => {
        errors.push(`Email 1 supabase query failed: ${err?.message || String(err)}`)
        return []
      })

    const airtablePending = ordersBaseId && hasAirtableOrdersConfig()
      ? await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName,
          filterByFormula: `AND({Status} = "pending", IS_BEFORE({Created At}, "${cutoff}"))`,
          maxRecords: 50,
        }).catch((err) => {
          errors.push(`Email 1 airtable query failed: ${err?.message || String(err)}`)
          return [] as Awaited<ReturnType<typeof queryAirtableRecords>>
        })
      : []

    const targets: CartTarget[] = []
    const seen = new Set<string>()
    for (const cart of supabasePending) {
      const t = mapSupabaseCart(cart)
      if (!t.orderId || seen.has(t.orderId)) continue
      seen.add(t.orderId)
      targets.push(t)
    }
    for (const record of airtablePending) {
      const t = mapAirtableCart(record)
      if (!t.orderId) {
        if (t.airtableRecordId) targets.push(t)
        continue
      }
      if (seen.has(t.orderId)) {
        // Already covered by Supabase target — graft on the airtable record id so updates mirror.
        const existing = targets.find((other) => other.orderId === t.orderId)
        if (existing && !existing.airtableRecordId) existing.airtableRecordId = t.airtableRecordId
        continue
      }
      seen.add(t.orderId)
      targets.push(t)
    }

    for (const target of targets) {
      if (!target.customerEmail) {
        errors.push(`Email 1 skipped (no customer email) for ${target.orderId || target.airtableRecordId || "unknown"}`)
        continue
      }
      const dedupKey = target.orderId || target.airtableRecordId || ""
      try {
        if (await hasCustomerAlreadyConverted(ordersBaseId, target.customerEmail)) {
          await expireCart(target)
          continue
        }

        if (!(await claimSendDedup(kv, 1, dedupKey))) {
          // Send already attempted in a prior run that failed to flip status.
          // Force the status update so this row leaves the pending sweep.
          await markEmailSent(target, 1)
          continue
        }

        await sendAbandonedCartEmail1({
          customerEmail: target.customerEmail,
          customerName: target.customerName,
          packTitle: target.packTitle,
          packQty: target.packQty,
          packPrice: target.packPrice,
          promoCode: target.promoCode,
          discountAmount: target.discountAmount,
        })

        await markEmailSent(target, 1)
        email1Sent++
      } catch (err: any) {
        errors.push(`Email 1 failed for ${target.customerEmail}: ${err?.message}`)
      }
    }
  } catch (err: any) {
    errors.push(`Email 1 sweep failed: ${err?.message}`)
  }

  // ── Email 2: email_1_sent carts where email 1 was sent >24h ago ──
  try {
    const cutoff = new Date(now.getTime() - EMAIL_2_DELAY_MS).toISOString()

    const supabaseFollowUp = await getSupabaseOrdersByStatusesBefore(["email_1_sent"], cutoff, 50, "email_1_sent_at")
      .catch((err) => {
        errors.push(`Email 2 supabase query failed: ${err?.message || String(err)}`)
        return []
      })

    const airtableFollowUp = ordersBaseId && hasAirtableOrdersConfig()
      ? await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName,
          filterByFormula: `AND({Status} = "email_1_sent", IS_BEFORE({Email 1 Sent At}, "${cutoff}"))`,
          maxRecords: 50,
        }).catch((err) => {
          errors.push(`Email 2 airtable query failed: ${err?.message || String(err)}`)
          return [] as Awaited<ReturnType<typeof queryAirtableRecords>>
        })
      : []

    const targets: CartTarget[] = []
    const seen = new Set<string>()
    for (const cart of supabaseFollowUp) {
      const t = mapSupabaseCart(cart)
      if (!t.orderId || seen.has(t.orderId)) continue
      seen.add(t.orderId)
      targets.push(t)
    }
    for (const record of airtableFollowUp) {
      const t = mapAirtableCart(record)
      if (!t.orderId) {
        if (t.airtableRecordId) targets.push(t)
        continue
      }
      if (seen.has(t.orderId)) {
        const existing = targets.find((other) => other.orderId === t.orderId)
        if (existing && !existing.airtableRecordId) existing.airtableRecordId = t.airtableRecordId
        continue
      }
      seen.add(t.orderId)
      targets.push(t)
    }

    for (const target of targets) {
      if (!target.customerEmail) {
        errors.push(`Email 2 skipped (no customer email) for ${target.orderId || target.airtableRecordId || "unknown"}`)
        continue
      }
      const dedupKey = target.orderId || target.airtableRecordId || ""
      try {
        if (await hasCustomerAlreadyConverted(ordersBaseId, target.customerEmail)) {
          await expireCart(target)
          continue
        }

        if (!(await claimSendDedup(kv, 2, dedupKey))) {
          await markEmailSent(target, 2)
          continue
        }

        await sendAbandonedCartEmail2({
          customerEmail: target.customerEmail,
          customerName: target.customerName,
          packTitle: target.packTitle,
          packQty: target.packQty,
          packPrice: target.packPrice,
          promoCode: target.promoCode,
          discountAmount: target.discountAmount,
        })

        await markEmailSent(target, 2)
        email2Sent++
      } catch (err: any) {
        errors.push(`Email 2 failed for ${target.customerEmail}: ${err?.message}`)
      }
    }
  } catch (err: any) {
    errors.push(`Email 2 sweep failed: ${err?.message}`)
  }

  return NextResponse.json({
    ok: true,
    processed: { email1Sent, email2Sent },
    errors: errors.length > 0 ? errors : undefined,
    timestamp: now.toISOString(),
  })
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
