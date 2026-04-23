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
  getRequiredEnv,
  queryAirtableRecords,
  updateAirtableRecord,
  logErrorToAirtable,
} from "@/lib/server/integrations"
import { isAuthorizedCron } from "@/lib/server/security"
import { getShiprocketOrderDetails } from "@/lib/server/shiprocket"

// Any non-terminal status — once status advances past "AWB Assigned" we still
// need to keep polling until the AWB is actually present in Airtable, since
// Shiprocket webhooks often skip the AWB field even in late-stage updates.
const TERMINAL_STATUSES = ["Delivered", "Cancelled", "RTO Delivered"]

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ordersBaseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")
  let synced = 0
  let checked = 0
  const errors: string[] = []

  try {
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

    const records = await queryAirtableRecords({
      baseId: ordersBaseId,
      tableName: "Payments",
      filterByFormula: formula,
      maxRecords: 20,
    })

    for (const record of records) {
      const fields = record.fields
      const shiprocketOrderId = Number(fields["Shiprocket Order ID"])
      const orderId = String(fields["Order ID"] || "")
      const currentAwb = String(fields["AWB Code"] || "")

      if (!shiprocketOrderId) continue
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
