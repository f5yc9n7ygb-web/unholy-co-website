import { NextRequest, NextResponse } from "next/server"
import {
  getRequiredEnv,
  queryAirtableRecords,
  updateAirtableRecord,
  sendAbandonedCartEmail1,
  sendAbandonedCartEmail2,
} from "@/lib/server/integrations"
import { escapeAirtableValue, isAuthorizedCron } from "@/lib/server/security"

const ABANDONED_THRESHOLD_MS = 30 * 60 * 1000      // 30 minutes
const EMAIL_2_DELAY_MS = 24 * 60 * 60 * 1000       // 24 hours after email 1

/**
 * Safety net: before emailing a cart, check whether the customer has already
 * converted (paid) on any other order. If so, skip the email and quietly mark
 * the cart expired so future sweeps ignore it.
 *
 * This guards against the case where verify/webhook supersede didn't run
 * (new flow, legacy row, transient Airtable error) and prevents sending
 * abandonment emails to customers who already paid — the bug that hit
 * Anurag Kalra.
 *
 * Returns true when the cart should be skipped (the caller must not email it).
 */
async function hasCustomerAlreadyConverted(
  ordersBaseId: string,
  customerEmail: string,
): Promise<boolean> {
  if (!customerEmail) return false
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
 */
export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
  const tableName = "Orders"
  const now = new Date()

  let email1Sent = 0
  let email2Sent = 0
  const errors: string[] = []

  // ── Email 1: pending carts older than 30 minutes ──
  try {
    const cutoff = new Date(now.getTime() - ABANDONED_THRESHOLD_MS).toISOString()
    const pendingCarts = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName,
      filterByFormula: `AND({Status} = "pending", IS_BEFORE({Created At}, "${cutoff}"))`,
      maxRecords: 50,
    })

    for (const record of pendingCarts) {
      const f = record.fields
      const customerEmail = String(f["Customer Email"] || "")
      try {
        // Safety net: don't email a customer whose cart we missed superseding
        // at conversion time. If they have any converted order, expire this row.
        if (await hasCustomerAlreadyConverted(ordersBaseId, customerEmail)) {
          await updateAirtableRecord({
            baseId: ordersBaseId,
            tableName,
            recordId: record.id,
            fields: { Status: "expired" },
          })
          continue
        }

        await sendAbandonedCartEmail1({
          customerEmail,
          customerName: String(f["Customer Name"] || "Sinner"),
          packTitle: String(f["Pack"] || "BloodThirst"),
          packQty: Number(f["Quantity"] || 0),
          packPrice: Number(f["Price"] || 0),
          promoCode: String(f["Promo Code"] || "") || undefined,
          discountAmount: Number(f["Discount Amount"] || 0) || undefined,
        })

        await updateAirtableRecord({
          baseId: ordersBaseId,
          tableName,
          recordId: record.id,
          fields: {
            "Status": "email_1_sent",
            "Email 1 Sent At": now.toISOString().split("T")[0],
          },
        })

        email1Sent++
      } catch (err: any) {
        errors.push(`Email 1 failed for ${customerEmail}: ${err?.message}`)
      }
    }
  } catch (err: any) {
    errors.push(`Email 1 query failed: ${err?.message}`)
  }

  // ── Email 2: email_1_sent carts where email 1 was sent >24h ago ──
  try {
    const cutoff = new Date(now.getTime() - EMAIL_2_DELAY_MS).toISOString()
    const followUpCarts = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName,
      filterByFormula: `AND({Status} = "email_1_sent", IS_BEFORE({Email 1 Sent At}, "${cutoff}"))`,
      maxRecords: 50,
    })

    for (const record of followUpCarts) {
      const f = record.fields
      const customerEmail = String(f["Customer Email"] || "")
      try {
        // Same safety net as email 1 — critical here because email 2 is the
        // 24h follow-up, more likely to catch a since-converted customer.
        if (await hasCustomerAlreadyConverted(ordersBaseId, customerEmail)) {
          await updateAirtableRecord({
            baseId: ordersBaseId,
            tableName,
            recordId: record.id,
            fields: { Status: "expired" },
          })
          continue
        }

        await sendAbandonedCartEmail2({
          customerEmail,
          customerName: String(f["Customer Name"] || "Sinner"),
          packTitle: String(f["Pack"] || "BloodThirst"),
          packQty: Number(f["Quantity"] || 0),
          packPrice: Number(f["Price"] || 0),
          promoCode: String(f["Promo Code"] || "") || undefined,
          discountAmount: Number(f["Discount Amount"] || 0) || undefined,
        })

        await updateAirtableRecord({
          baseId: ordersBaseId,
          tableName,
          recordId: record.id,
          fields: {
            "Status": "email_2_sent",
            "Email 2 Sent At": now.toISOString().split("T")[0],
          },
        })

        email2Sent++
      } catch (err: any) {
        errors.push(`Email 2 failed for ${customerEmail}: ${err?.message}`)
      }
    }
  } catch (err: any) {
    errors.push(`Email 2 query failed: ${err?.message}`)
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
