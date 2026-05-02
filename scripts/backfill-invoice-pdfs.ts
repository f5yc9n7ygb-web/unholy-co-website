#!/usr/bin/env -S npx tsx
/**
 * One-off backfill: attach invoice PDFs to every Payments record that
 * doesn't have one yet.
 *
 * Prerequisites — the script needs two env vars:
 *   AIRTABLE_TOKEN          (your Airtable personal access token)
 *   AIRTABLE_ORDERS_BASE_ID (the base that contains the Payments table)
 *
 * Provide them via .env.local or inline:
 *
 *   npx tsx scripts/backfill-invoice-pdfs.ts
 *   AIRTABLE_TOKEN=xxx AIRTABLE_ORDERS_BASE_ID=yyy npx tsx scripts/backfill-invoice-pdfs.ts
 */

import { readFileSync } from "node:fs"

// Load .env.local before anything that might read process.env.
// Static imports above don't read env vars at module-eval time, so this is safe.
try {
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m?.[1] && !process.env[m[1]]) {
      process.env[m[1]] = m[2]!.replace(/^["']|["']$/g, "").trim()
    }
  }
} catch { /* no .env.local — rely on shell env */ }

import { generateInvoicePdf } from "@/lib/pdf/generate-invoice"

const AIRTABLE_ENDPOINT = "https://api.airtable.com/v0"

// Stay safely under Airtable's 5 req/s rate limit.
const DELAY_MS = 250

// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`\nMissing required env var: ${name}`)
    console.error("Set it in .env.local or pass it inline before the command.\n")
    process.exit(1)
  }
  return v
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

type AirtableRecord = { id: string; fields: Record<string, unknown> }

/** Fetch all Payments records that have no Invoice PDF, handling pagination. */
async function fetchPendingRecords(baseId: string, token: string): Promise<AirtableRecord[]> {
  const all: AirtableRecord[] = []
  let offset: string | undefined

  do {
    const params = new URLSearchParams({
      filterByFormula: "NOT({Invoice PDF})",
      maxRecords: "100",
    })
    if (offset) params.set("offset", offset)

    const url = `${AIRTABLE_ENDPOINT}/${baseId}/${encodeURIComponent("Payments")}?${params}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store" as RequestCache,
    })

    if (!res.ok) {
      throw new Error(`Airtable query failed (${res.status}): ${await res.text()}`)
    }

    const data = await res.json() as { records: AirtableRecord[]; offset?: string }
    all.push(...data.records)
    offset = data.offset

    if (offset) await sleep(DELAY_MS)
  } while (offset)

  return all
}

async function uploadPdf(
  baseId: string,
  token: string,
  recordId: string,
  filename: string,
  pdfBytes: Uint8Array,
): Promise<void> {
  const url = `${AIRTABLE_ENDPOINT}/${baseId}/${encodeURIComponent("Payments")}/${recordId}/${encodeURIComponent("Invoice PDF")}/uploadAttachment`

  const form = new FormData()
  form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), filename)
  form.append("filename", filename)

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`)
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const token = requireEnv("AIRTABLE_TOKEN")
  const baseId = requireEnv("AIRTABLE_ORDERS_BASE_ID")

  console.log("Querying Payments records without an Invoice PDF attachment...")
  const records = await fetchPendingRecords(baseId, token)

  if (records.length === 0) {
    console.log("All records already have an invoice attached. Nothing to do.")
    return
  }

  console.log(`Found ${records.length} record(s) to backfill.\n`)

  let succeeded = 0
  let failed = 0

  for (let i = 0; i < records.length; i++) {
    const { id: recordId, fields } = records[i]!
    const orderId = String(fields["Order ID"] || "")
    const label = orderId || recordId
    process.stdout.write(`[${i + 1}/${records.length}] ${label} ... `)

    try {
      const pdfBytes = await generateInvoicePdf({
        orderId,
        paymentId:       String(fields["Payment ID"]       || ""),
        pack:            String(fields["Pack"]              || ""),
        quantity:        Number(fields["Quantity"]          || 0),
        amount:          Number(fields["Amount"]            || 0),
        customerName:    String(fields["Customer Name"]     || ""),
        customerEmail:   String(fields["Customer Email"]    || ""),
        customerPhone:   String(fields["Customer Phone"]    || "") || undefined,
        shippingAddress: String(fields["Shipping Address"]  || fields["Full Shipping Address"] || ""),
        shippingCity:    String(fields["Shipping City"]     || "") || undefined,
        shippingState:   String(fields["Shipping State"]    || "") || undefined,
        shippingPincode: String(fields["Shipping Pincode"]  || "") || undefined,
        timestamp:       String(fields["Timestamp"]         || new Date().toISOString()),
        promoCode:       String(fields["Promo Code"]        || "") || undefined,
        discountAmount:  Number(fields["Discount Amount"]   || 0)  || undefined,
        buyerGstNumber:  String(fields["GST Number"]        || "") || undefined,
        buyerBusinessName: String(fields["GST Business Name"] || "") || undefined,
        invoiceSeq:      Number(fields["Invoice Number"]    || 0)  || undefined,
      })

      await uploadPdf(baseId, token, recordId, `UNHOLY-Invoice-${orderId}.pdf`, pdfBytes)
      process.stdout.write("✓\n")
      succeeded++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`✗  ${msg}\n`)
      failed++
    }

    if (i < records.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n── Summary ─────────────────────`)
  console.log(`  Uploaded : ${succeeded}`)
  if (failed > 0) console.log(`  Failed   : ${failed}`)
  console.log(`────────────────────────────────`)
}

main().catch(err => {
  console.error("\nFatal error:", err)
  process.exit(1)
})
