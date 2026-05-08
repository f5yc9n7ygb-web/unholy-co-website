#!/usr/bin/env node
/**
 * One-shot backfill: pull current AWB, courier, and shipping status from
 * Shiprocket for every Payment record that has a Shiprocket Order ID and
 * isn't in a terminal state. Fixes records left stuck at "Processing" by
 * the old broken webhook/cron parser.
 *
 * Usage:
 *   node scripts/backfill-shiprocket.mjs            # dry-run (no writes)
 *   node scripts/backfill-shiprocket.mjs --apply    # write changes
 *
 * Reads credentials from .env.local.
 */

import fs from "node:fs"
import path from "node:path"

const APPLY = process.argv.includes("--apply")

// ─── Load .env.local ─────────────────────────────────────────────────────────
const envText = fs.readFileSync(path.resolve(".env.local"), "utf8")
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (!m) continue
  if (!process.env[m[1]]) process.env[m[1]] = m[2]
}

const {
  SHIPROCKET_EMAIL,
  SHIPROCKET_PASSWORD,
  AIRTABLE_TOKEN,
  AIRTABLE_ORDERS_BASE_ID,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)

if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
  console.error("Missing SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD")
  process.exit(1)
}
if (!AIRTABLE_TOKEN || !AIRTABLE_ORDERS_BASE_ID) {
  console.error("Missing AIRTABLE_TOKEN / AIRTABLE_ORDERS_BASE_ID")
  process.exit(1)
}
if (!SUPABASE_ENABLED) {
  console.warn("Supabase env vars missing; will only write to Airtable.")
}

// Status code → label (matches webhook handler's STATUS_MAP)
const STATUS_MAP = {
  1: "New",
  2: "AWB Assigned",
  3: "Label Generated",
  4: "Pickup Scheduled",
  5: "Manifest Generated",
  6: "Shipped",
  7: "Delivered",
  8: "Cancelled",
  9: "RTO Initiated",
  10: "RTO Delivered",
  17: "Out for Delivery",
  18: "In Transit",
  19: "Out for Pickup",
  20: "In Transit",
  21: "Undelivered",
  22: "Delayed",
  38: "Reached Destination Hub",
  42: "Picked Up",
}

const SR_API = "https://apiv2.shiprocket.in/v1/external"
const SR_UA = "UnholyCo/1.0 (Backfill)"

// ─── Shiprocket ──────────────────────────────────────────────────────────────
async function srLogin() {
  const r = await fetch(`${SR_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": SR_UA },
    body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
  })
  if (!r.ok) throw new Error(`Shiprocket login failed: ${r.status} ${await r.text()}`)
  const d = await r.json()
  return d.token
}

async function srGetOrder(token, shiprocketOrderId) {
  const r = await fetch(`${SR_API}/orders/show/${shiprocketOrderId}`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": SR_UA },
  })
  if (!r.ok) {
    if (r.status === 404) return null
    throw new Error(`orders/show/${shiprocketOrderId} failed: ${r.status} ${await r.text()}`)
  }
  const d = await r.json()
  const data = d.data
  if (!data) return null
  const s = Array.isArray(data.shipments) ? data.shipments[0] : data.shipments
  const awb = s?.awb || s?.awb_code || data.awb_data?.awb || null
  const courier = s?.courier || s?.courier_name || null
  const statusCode = Number(data.status_code || s?.status_code || 0)
  const statusLabel =
    STATUS_MAP[statusCode] || (data.status ? titleCase(data.status) : null) || "Updated"
  return { awb, courier, statusCode, statusLabel, rawStatus: data.status }
}

function titleCase(s) {
  return String(s)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Airtable ────────────────────────────────────────────────────────────────
const AT_BASE = `https://api.airtable.com/v0/${AIRTABLE_ORDERS_BASE_ID}`
const AT_HEADERS = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
}
const TABLE = "Payments"

async function atListAll() {
  // Pull everything that has a Shiprocket Order ID (we'll skip terminal ones
  // below so we can still refresh to a terminal status if the local record
  // hasn't caught up yet).
  const formula = `{Shiprocket Order ID} != ''`
  let out = []
  let offset = ""
  do {
    const url = new URL(`${AT_BASE}/${encodeURIComponent(TABLE)}`)
    url.searchParams.set("filterByFormula", formula)
    url.searchParams.set("pageSize", "100")
    if (offset) url.searchParams.set("offset", offset)
    const r = await fetch(url, { headers: AT_HEADERS })
    if (!r.ok) throw new Error(`Airtable list failed: ${r.status} ${await r.text()}`)
    const d = await r.json()
    out = out.concat(d.records)
    offset = d.offset || ""
  } while (offset)
  return out
}

async function atBatchUpdate(records) {
  // Airtable PATCH limit is 10 per call
  for (let i = 0; i < records.length; i += 10) {
    const chunk = records.slice(i, i + 10)
    const r = await fetch(`${AT_BASE}/${encodeURIComponent(TABLE)}`, {
      method: "PATCH",
      headers: AT_HEADERS,
      body: JSON.stringify({ records: chunk }),
    })
    if (!r.ok) {
      throw new Error(`Airtable PATCH failed: ${r.status} ${await r.text()}`)
    }
  }
}

// ─── Supabase ────────────────────────────────────────────────────────────────
async function supabasePatchPaymentByOrderId(orderId, patch) {
  if (!SUPABASE_ENABLED || !orderId) return
  const params = new URLSearchParams({ order_id: `eq.${orderId}` })
  const r = await fetch(`${SUPABASE_URL}/rest/v1/payments?${params}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  })
  if (!r.ok) {
    throw new Error(`Supabase PATCH failed for ${orderId}: ${r.status} ${await r.text()}`)
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writing)" : "DRY-RUN (no writes)"}`)

  const token = await srLogin()
  console.log("Shiprocket authenticated.")

  const rows = await atListAll()
  console.log(`Found ${rows.length} Payment records with Shiprocket Order ID.`)

  const updates = []
  const skipped = []
  const errors = []

  for (const row of rows) {
    const f = row.fields
    const srOrderId = Number(f["Shiprocket Order ID"])
    const orderId = String(f["Order ID"] || "")
    const currentAwb = String(f["AWB Code"] || "")
    const currentCourier = String(f["Courier Name"] || "")
    const currentStatus = String(f["Shipping Status"] || "")

    if (!srOrderId) continue

    try {
      const d = await srGetOrder(token, srOrderId)
      if (!d) {
        skipped.push(`${orderId}: not found on Shiprocket`)
        continue
      }

      const patch = {}
      if (d.awb && d.awb !== currentAwb) patch["AWB Code"] = d.awb
      if (d.courier && d.courier !== currentCourier) patch["Courier Name"] = d.courier
      if (d.statusLabel && d.statusLabel !== currentStatus) {
        patch["Shipping Status"] = d.statusLabel
      }

      if (Object.keys(patch).length === 0) {
        skipped.push(`${orderId}: already up to date (${currentStatus})`)
        continue
      }

      console.log(
        `→ ${orderId}  [${currentStatus}] → [${d.statusLabel}]  AWB=${d.awb || "-"}  courier=${d.courier || "-"}`,
      )
      const supabasePatch = {}
      if (patch["AWB Code"]) supabasePatch.awb_code = patch["AWB Code"]
      if (patch["Courier Name"]) supabasePatch.courier_name = patch["Courier Name"]
      if (patch["Shipping Status"]) supabasePatch.shipping_status = patch["Shipping Status"]
      updates.push({ id: row.id, fields: patch, orderId, supabasePatch })
    } catch (e) {
      errors.push(`${orderId} (SR#${srOrderId}): ${e.message}`)
    }

    // polite pacing — Shiprocket rate-limits heavily
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`\nPlanned updates: ${updates.length}`)
  console.log(`Already up to date: ${skipped.length}`)
  if (errors.length) {
    console.log(`\nErrors (${errors.length}):`)
    for (const e of errors) console.log(`  ${e}`)
  }

  if (!APPLY) {
    console.log(`\nDry-run — re-run with --apply to write.`)
    return
  }

  if (updates.length > 0) {
    await atBatchUpdate(updates.map(({ id, fields }) => ({ id, fields })))
    console.log(`Wrote ${updates.length} updates to Airtable.`)

    if (SUPABASE_ENABLED) {
      let supabaseUpdated = 0
      const supabaseErrors = []
      for (const { orderId, supabasePatch } of updates) {
        if (!orderId || Object.keys(supabasePatch).length === 0) continue
        try {
          await supabasePatchPaymentByOrderId(orderId, supabasePatch)
          supabaseUpdated++
        } catch (e) {
          supabaseErrors.push(`${orderId}: ${e.message}`)
        }
      }
      console.log(`Wrote ${supabaseUpdated} updates to Supabase.`)
      if (supabaseErrors.length) {
        console.log(`Supabase errors (${supabaseErrors.length}):`)
        for (const e of supabaseErrors) console.log(`  ${e}`)
      }
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
