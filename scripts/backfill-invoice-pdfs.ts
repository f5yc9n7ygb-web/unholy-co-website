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

import { Buffer } from "node:buffer"
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
const AIRTABLE_CONTENT_ENDPOINT = "https://content.airtable.com/v0"

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

async function fetchWithRetry(url: string, init: RequestInit, attempts = 4): Promise<Response> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init)
      if (res.status !== 429 && res.status < 500) return res
      lastError = new Error(`HTTP ${res.status}: ${await res.text()}`)
    } catch (err) {
      lastError = err
    }
    if (i < attempts - 1) await sleep(750 * (i + 1))
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

type AirtableRecord = { id: string; fields: Record<string, unknown> }

/** Fetch Payments records matching a formula, handling pagination. */
async function fetchRecords(
  baseId: string,
  token: string,
  filterByFormula: string,
  sortDirection: "asc" | "desc" = "asc",
): Promise<AirtableRecord[]> {
  const all: AirtableRecord[] = []
  let offset: string | undefined

  do {
    const params = new URLSearchParams({
      filterByFormula,
      maxRecords: "100",
      "sort[0][field]": "Timestamp",
      "sort[0][direction]": sortDirection,
    })
    if (offset) params.set("offset", offset)

    const url = `${AIRTABLE_ENDPOINT}/${baseId}/${encodeURIComponent("Payments")}?${params}`
    const res = await fetchWithRetry(url, {
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

async function updateRecord(
  baseId: string,
  token: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const url = `${AIRTABLE_ENDPOINT}/${baseId}/${encodeURIComponent("Payments")}/${recordId}`
  const res = await fetchWithRetry(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  })

  if (!res.ok) {
    throw new Error(`Airtable update failed (${res.status}): ${await res.text()}`)
  }
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

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`)
  }
}

// ─── Supabase mirror ─────────────────────────────────────────────────────────
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const SUPABASE_BUCKET = process.env.SUPABASE_INVOICE_BUCKET || "invoices"
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)

async function supabaseUploadInvoicePdf(storagePath: string, pdfBytes: Uint8Array): Promise<void> {
  if (!SUPABASE_ENABLED) return
  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/")
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    },
    body: pdfBytes as any,
  })
  if (!res.ok) {
    throw new Error(`Supabase storage upload failed (${res.status}): ${await res.text()}`)
  }
}

async function supabasePaymentRowExists(orderId: string): Promise<boolean> {
  if (!SUPABASE_ENABLED || !orderId) return false
  const params = new URLSearchParams({ select: "order_id", order_id: `eq.${orderId}`, limit: "1" })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/payments?${params}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  if (!res.ok) {
    throw new Error(`Supabase payments lookup failed for ${orderId}: ${res.status} ${await res.text()}`)
  }
  const rows = (await res.json()) as Array<{ order_id: string }>
  return rows.length > 0
}

async function supabasePatchPaymentByOrderId(orderId: string, patch: Record<string, unknown>): Promise<void> {
  if (!SUPABASE_ENABLED || !orderId) return
  const params = new URLSearchParams({ order_id: `eq.${orderId}` })
  const res = await fetch(`${SUPABASE_URL}/rest/v1/payments?${params}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    throw new Error(`Supabase payments PATCH failed for ${orderId}: ${res.status} ${await res.text()}`)
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const token = requireEnv("AIRTABLE_TOKEN")
  const baseId = requireEnv("AIRTABLE_ORDERS_BASE_ID")

  console.log("Querying Payments records with missing PDFs or missing invoice numbers...")
  const records = await fetchRecords(
    baseId,
    token,
    "OR(NOT({Invoice PDF}), NOT({Invoice Number}), {Invoice Number}=0)",
  )

  if (records.length === 0) {
    console.log("All records already have an invoice number and attached PDF. Nothing to do.")
    return
  }

  const numberedRecords = await fetchRecords(
    baseId,
    token,
    "AND({Invoice Number}, {Invoice Number} != 0)",
    "desc",
  )
  const maxInvoiceSeq = numberedRecords.reduce((max, record) => {
    const seq = Number(record.fields["Invoice Number"] || 0)
    return Number.isFinite(seq) && seq > max ? seq : max
  }, 0)
  let nextInvoiceSeq = maxInvoiceSeq + 1

  console.log(`Found ${records.length} record(s) to backfill/repair.`)
  console.log(`Next invoice sequence starts at ${nextInvoiceSeq}.\n`)

  let succeeded = 0
  let failed = 0

  for (let i = 0; i < records.length; i++) {
    const { id: recordId, fields } = records[i]!
    const orderId = String(fields["Order ID"] || "")
    const label = orderId || recordId
    process.stdout.write(`[${i + 1}/${records.length}] ${label} ... `)

    try {
      const existingSeq = Number(fields["Invoice Number"] || 0)
      const invoiceSeq = Number.isFinite(existingSeq) && existingSeq > 0
        ? existingSeq
        : nextInvoiceSeq++

      // Clear any stale PDF before upload. This replaces invoices generated
      // before an invoice number had been assigned.
      await updateRecord(baseId, token, recordId, {
        "Invoice Number": invoiceSeq,
        "Invoice PDF": [],
      })
      await sleep(DELAY_MS)

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
        invoiceSeq,
      })

      await uploadPdf(baseId, token, recordId, `UNHOLY-Invoice-${orderId}.pdf`, pdfBytes)

      if (SUPABASE_ENABLED) {
        try {
          // Skip Supabase upload entirely if the payments row hasn't been migrated yet —
          // otherwise the storage object is orphaned with no row to reference it.
          if (!(await supabasePaymentRowExists(orderId))) {
            process.stdout.write("(supabase row missing, skipped) ")
          } else {
            const storagePath = `${String(invoiceSeq).padStart(4, "0")}-${orderId}.pdf`
            await supabaseUploadInvoicePdf(storagePath, pdfBytes)
            await supabasePatchPaymentByOrderId(orderId, {
              invoice_seq: invoiceSeq,
              invoice_storage_path: storagePath,
            })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          process.stdout.write(`(supabase skipped: ${msg}) `)
        }
      }

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
