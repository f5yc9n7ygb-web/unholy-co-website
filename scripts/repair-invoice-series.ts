#!/usr/bin/env -S npx tsx

import { Buffer } from "node:buffer"
import { readFileSync } from "node:fs"
import { generateInvoicePdf } from "@/lib/pdf/generate-invoice"

try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m?.[1] && !process.env[m[1]]) {
      process.env[m[1]] = m[2]!.replace(/^["']|["']$/g, "").trim()
    }
  }
} catch { /* rely on shell env */ }

const AIRTABLE_ENDPOINT = "https://api.airtable.com/v0"
const AIRTABLE_CONTENT_ENDPOINT = "https://content.airtable.com/v0"
const TABLE_NAME = "Payments"
const DELAY_MS = 1500

// Preserve already-issued stranger invoices unchanged.
const PRESERVED_RECORD_IDS = new Set([
  "recS72JyDVXRskb0T", // Anurag Kalra, invoice 29
  "recaRuQF3RqM52RDc", // Vivek Tholasi, invoice 30
])

type AirtableRecord = {
  id: string
  createdTime: string
  fields: Record<string, unknown>
}

type PlannedRecord = {
  record: AirtableRecord
  effectiveTimestamp: string
  fy: string
  currentSeq: number
  targetSeq: number
  preserved: boolean
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, init: RequestInit, attempts = 10): Promise<Response> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init)
      if (res.status !== 429 && res.status < 500) return res
      lastError = new Error(`HTTP ${res.status}: ${await res.text()}`)
    } catch (err) {
      lastError = err
    }
    if (i < attempts - 1) await sleep(1500 * (i + 1))
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

function financialYear(timestamp: string): string {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const start = month >= 4 ? year : year - 1
  return `${start}-${start + 1}`
}

function legacyInvoiceNumber(orderId: string, timestamp: string, invoiceSeq: number): string {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const fyStart = month >= 4 ? year : year - 1
  const fyEnd = fyStart + 1
  const fy = `${String(fyStart).slice(2)}-${String(fyEnd).slice(2)}`
  const suffix = orderId.replace(/^order_/, "").slice(-6).toUpperCase()
  return `UHC/${fy}/${suffix}/${invoiceSeq}`
}

function numberValue(value: unknown): number {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

async function fetchInvoiceRecords(baseId: string, token: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = []
  let offset: string | undefined

  do {
    const params = new URLSearchParams({
      filterByFormula: "{Invoice Number}",
      maxRecords: "100",
    })
    if (offset) params.set("offset", offset)

    const url = `${AIRTABLE_ENDPOINT}/${baseId}/${encodeURIComponent(TABLE_NAME)}?${params}`
    const res = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store" as RequestCache,
    })
    if (!res.ok) throw new Error(`Airtable query failed (${res.status}): ${await res.text()}`)

    const data = await res.json() as { records: AirtableRecord[]; offset?: string }
    records.push(...data.records)
    offset = data.offset
  } while (offset)

  return records
}

function buildPlan(records: AirtableRecord[]): PlannedRecord[] {
  const byFy = new Map<string, PlannedRecord[]>()

  for (const record of records) {
    const effectiveTimestamp = String(record.fields.Timestamp || record.createdTime)
    const fy = financialYear(effectiveTimestamp)
    const planned: PlannedRecord = {
      record,
      effectiveTimestamp,
      fy,
      currentSeq: numberValue(record.fields["Invoice Number"]),
      targetSeq: 0,
      preserved: PRESERVED_RECORD_IDS.has(record.id),
    }
    const group = byFy.get(fy) || []
    group.push(planned)
    byFy.set(fy, group)
  }

  for (const group of byFy.values()) {
    group.sort((a, b) => a.effectiveTimestamp.localeCompare(b.effectiveTimestamp))
    const fixed = new Set(group.filter((r) => r.preserved).map((r) => r.currentSeq))
    let nextSeq = 1

    for (const planned of group) {
      if (planned.preserved) {
        planned.targetSeq = planned.currentSeq
        continue
      }
      while (fixed.has(nextSeq)) nextSeq++
      planned.targetSeq = nextSeq
      nextSeq++
    }
  }

  return [...byFy.values()]
    .flat()
    .sort((a, b) => a.effectiveTimestamp.localeCompare(b.effectiveTimestamp))
}

async function updateRecord(
  baseId: string,
  token: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const url = `${AIRTABLE_ENDPOINT}/${baseId}/${encodeURIComponent(TABLE_NAME)}/${recordId}`
  const res = await fetchWithRetry(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) throw new Error(`Airtable update failed (${res.status}): ${await res.text()}`)
}

async function uploadPdf(
  baseId: string,
  token: string,
  recordId: string,
  filename: string,
  pdfBytes: Uint8Array,
): Promise<void> {
  const url = `${AIRTABLE_CONTENT_ENDPOINT}/${baseId}/${recordId}/${encodeURIComponent("Invoice PDF")}/uploadAttachment`
  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentType: "application/pdf",
      filename,
      file: Buffer.from(pdfBytes).toString("base64"),
    }),
  })
  if (!res.ok) throw new Error(`Airtable upload failed (${res.status}): ${await res.text()}`)
}

async function applyRecord(baseId: string, token: string, planned: PlannedRecord): Promise<void> {
  const fields = planned.record.fields
  const orderId = String(fields["Order ID"] || "")

  await updateRecord(baseId, token, planned.record.id, {
    "Invoice Number": planned.targetSeq,
    "Invoice PDF": [],
  })
  await sleep(DELAY_MS)

  const pdfBytes = await generateInvoicePdf({
    orderId,
    paymentId: String(fields["Payment ID"] || ""),
    pack: String(fields["Pack"] || ""),
    quantity: Number(fields["Quantity"] || 0),
    amount: Number(fields["Amount"] || 0),
    customerName: String(fields["Customer Name"] || ""),
    customerEmail: String(fields["Customer Email"] || ""),
    customerPhone: String(fields["Customer Phone"] || "") || undefined,
    shippingAddress: String(fields["Shipping Address"] || fields["Full Shipping Address"] || ""),
    shippingCity: String(fields["Shipping City"] || "") || undefined,
    shippingState: String(fields["Shipping State"] || "") || undefined,
    shippingPincode: String(fields["Shipping Pincode"] || "") || undefined,
    timestamp: String(fields["Timestamp"] || planned.record.createdTime),
    promoCode: String(fields["Promo Code"] || "") || undefined,
    discountAmount: Number(fields["Discount Amount"] || 0) || undefined,
    buyerGstNumber: String(fields["GST Number"] || fields["GST number"] || "") || undefined,
    buyerBusinessName: String(fields["GST Business Name"] || "") || undefined,
    invoiceSeq: planned.targetSeq,
    invoiceNumber: legacyInvoiceNumber(orderId, String(fields["Timestamp"] || planned.record.createdTime), planned.targetSeq),
  })

  await uploadPdf(baseId, token, planned.record.id, `UNHOLY-Invoice-${orderId}.pdf`, pdfBytes)
}

async function main() {
  const shouldApply = process.argv.includes("--apply")
  const token = requireEnv("AIRTABLE_TOKEN")
  const baseId = requireEnv("AIRTABLE_ORDERS_BASE_ID")
  const records = await fetchInvoiceRecords(baseId, token)
  const plan = buildPlan(records)
  const changes = plan.filter((p) => !p.preserved && p.currentSeq !== p.targetSeq)
  const regenerations = plan.filter((p) => !p.preserved)

  console.log(`Invoice records: ${plan.length}`)
  console.log(`Preserved: ${plan.filter((p) => p.preserved).length}`)
  console.log(`Number changes: ${changes.length}`)
  console.log(`PDF regenerations: ${regenerations.length}`)
  console.log("")

  for (const p of plan) {
    const marker = p.preserved ? "PRESERVE" : p.currentSeq === p.targetSeq ? "regen" : "change"
    const name = String(p.record.fields["Customer Name"] || "")
    const orderId = String(p.record.fields["Order ID"] || "")
    console.log(`${p.fy} ${marker.padEnd(8)} ${String(p.currentSeq).padStart(2)} -> ${String(p.targetSeq).padStart(2)} ${orderId} ${name}`)
  }

  if (!shouldApply) {
    console.log("\nDry run only. Re-run with --apply to mutate Airtable.")
    return
  }

  console.log("\nApplying repair...")
  let ok = 0
  let failed = 0
  for (const planned of regenerations) {
    const orderId = String(planned.record.fields["Order ID"] || planned.record.id)
    process.stdout.write(`${orderId} ${planned.currentSeq} -> ${planned.targetSeq} ... `)
    try {
      await applyRecord(baseId, token, planned)
      ok++
      process.stdout.write("ok\n")
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      process.stdout.write(`failed: ${message}\n`)
    }
    await sleep(DELAY_MS)
  }

  console.log(`\nApplied: ${ok}`)
  if (failed) console.log(`Failed: ${failed}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
