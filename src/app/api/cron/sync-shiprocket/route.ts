/**
 * POST /api/cron/sync-shiprocket
 *
 * Protected by CRON_SECRET bearer token.
 * Polls Shiprocket for AWB/status updates on orders that have a Shiprocket
 * Order ID but are missing AWB or still in early status.
 *
 * Compensates for Shiprocket's unreliable webhook delivery.
 * Safe to run every 15–30 minutes.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  hasAirtableOrdersConfig,
  queryAirtableRecords,
  updateAirtableRecord,
  logErrorToAirtable,
} from "@/lib/server/integrations"
import { escapeAirtableValue, isAuthorizedCron } from "@/lib/server/security"
import { getShiprocketOrderDetails } from "@/lib/server/shiprocket"
import {
  getSupabasePaymentsWithShiprocketOrder,
  updateSupabasePaymentByOrderId,
} from "@/lib/server/supabase"

// Any non-terminal status — once status advances past "AWB Assigned" we still
// need to keep polling until the AWB is actually present in Airtable, since
// Shiprocket webhooks often skip the AWB field even in late-stage updates.
const TERMINAL_STATUSES = ["Delivered", "Cancelled", "RTO Delivered"]

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ordersBaseId = process.env.AIRTABLE_ORDERS_BASE_ID || ""
  let synced = 0
  let checked = 0
  const errors: string[] = []

  try {
    const supabasePayments = (await getSupabasePaymentsWithShiprocketOrder(50))
      .filter((payment) => {
        const status = String(payment.shipping_status || "")
        return !TERMINAL_STATUSES.includes(status) && (!payment.awb_code || !payment.courier_name)
      })
      .slice(0, 20)

    // Find payments with a Shiprocket Order ID that haven't reached a terminal state
    // and still need something synced (either no AWB yet, or no courier yet).
    const terminalGuard = TERMINAL_STATUSES.map(
      (s) => `{Shipping Status} != "${s}"`,
    ).join(", ")
    const formula = `AND(
      {Shiprocket Order ID} != '',
      ${terminalGuard},
      OR({AWB Code} = '', {Courier Name} = '')
    )`

    const records = !ordersBaseId || !hasAirtableOrdersConfig()
      ? []
      : await queryAirtableRecords({
          baseId: ordersBaseId,
          tableName: "Payments",
          filterByFormula: formula,
          maxRecords: 20,
        }).catch((err) => {
          errors.push(`airtable lookup: ${err?.message || String(err)}`)
          return [] as Awaited<ReturnType<typeof queryAirtableRecords>>
        })

    const handledOrderIds = new Set<string>()

    for (const payment of supabasePayments) {
      const shiprocketOrderId = Number(payment.shiprocket_order_id)
      const orderId = String(payment.order_id || "")
      const currentAwb = String(payment.awb_code || "")

      if (!shiprocketOrderId) continue
      if (orderId) handledOrderIds.add(orderId)
      checked++

      try {
        const details = await getShiprocketOrderDetails(shiprocketOrderId)
        if (!details) continue

        const supabaseUpdateFields: Record<string, string | number> = {}
        const airtableUpdateFields: Record<string, string | number> = {}

        if (details.awbCode && details.awbCode !== currentAwb) {
          supabaseUpdateFields.awb_code = details.awbCode
          airtableUpdateFields["AWB Code"] = details.awbCode
        }

        if (details.courierName) {
          supabaseUpdateFields.courier_name = details.courierName
          airtableUpdateFields["Courier Name"] = details.courierName
        }

        const currentStatus = String(payment.shipping_status || "")
        if (
          details.awbCode &&
          !currentAwb &&
          (currentStatus === "Processing" || currentStatus === "Shiprocket Failed" || currentStatus === "")
        ) {
          supabaseUpdateFields.shipping_status = "AWB Assigned"
          airtableUpdateFields["Shipping Status"] = "AWB Assigned"
        }

        if (Object.keys(supabaseUpdateFields).length > 0) {
          await updateSupabasePaymentByOrderId(orderId, supabaseUpdateFields)
          if (ordersBaseId && hasAirtableOrdersConfig()) {
            const mirrorRecords = await queryAirtableRecords({
              baseId: ordersBaseId,
              tableName: "Payments",
              filterByFormula: `{Order ID} = "${escapeAirtableValue(orderId)}"`,
              maxRecords: 1,
            }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)
            if (mirrorRecords[0]) {
              await updateAirtableRecord({
                baseId: ordersBaseId,
                tableName: "Payments",
                recordId: mirrorRecords[0].id,
                fields: airtableUpdateFields,
              }).catch((err) => console.error(`Airtable Shiprocket mirror failed for ${orderId}:`, err))
            }
          }
          synced++
          console.log(`Synced order ${orderId}: AWB=${details.awbCode}, Courier=${details.courierName}`)
        }
      } catch (err: any) {
        errors.push(`Order ${orderId} (SR#${shiprocketOrderId}): ${err?.message || err}`)
      }
    }

    for (const record of records) {
      const fields = record.fields
      const shiprocketOrderId = Number(fields["Shiprocket Order ID"])
      const orderId = String(fields["Order ID"] || "")
      const currentAwb = String(fields["AWB Code"] || "")

      if (!shiprocketOrderId) continue
      // Supabase loop above already handled this order — skip to avoid double-calling Shiprocket.
      if (orderId && handledOrderIds.has(orderId)) continue
      checked++

      try {
        const details = await getShiprocketOrderDetails(shiprocketOrderId)
        if (!details) continue

        const updateFields: Record<string, string | number> = {}

        // Update AWB if we didn't have it
        if (details.awbCode && details.awbCode !== currentAwb) {
          updateFields["AWB Code"] = details.awbCode
        }

        if (details.courierName) {
          updateFields["Courier Name"] = details.courierName
        }

        // Only promote status to "AWB Assigned" from pre-AWB states — don't
        // regress an already-advanced status (Shipped / In Transit / etc.)
        // back to AWB Assigned just because we backfilled the AWB field.
        const currentStatus = String(fields["Shipping Status"] || "")
        if (
          details.awbCode &&
          !currentAwb &&
          (currentStatus === "Processing" || currentStatus === "Shiprocket Failed" || currentStatus === "")
        ) {
          updateFields["Shipping Status"] = "AWB Assigned"
        }

        if (Object.keys(updateFields).length > 0) {
          await updateAirtableRecord({
            baseId: ordersBaseId,
            tableName: "Payments",
            recordId: record.id,
            fields: updateFields,
          })
          synced++
          console.log(`Synced order ${orderId}: AWB=${details.awbCode}, Courier=${details.courierName}`)
        }
      } catch (err: any) {
        errors.push(`Order ${orderId} (SR#${shiprocketOrderId}): ${err?.message || err}`)
      }
    }
  } catch (err: any) {
    await logErrorToAirtable("Shiprocket Sync Cron", err)
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, checked, synced, errors })
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
