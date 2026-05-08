#!/usr/bin/env -S node ./node_modules/sucrase/bin/sucrase-node

import { readFile } from "node:fs/promises"
import { join } from "node:path"

const DEFAULT_PAYMENTS_CSV = "/Users/aakashsingh/Downloads/Payments-Grid view.csv"
const DEFAULT_INVOICE_DIR = "/Users/aakashsingh/Downloads/corrected-unholy-invoices"
const DEFAULT_MANIFEST = join(DEFAULT_INVOICE_DIR, "manifest.csv")
const DEFAULT_BUCKET = "invoices"

type CsvRow = Record<string, string>

type ManifestRow = {
  invoiceSeq: string
  originalInvoiceSeq: string
  invoiceNo: string
  orderId: string
  customerName: string
  state: string
  gstNumber: string
  gstBusinessName: string
  taxType: "CGST+SGST" | "IGST"
  file: string
}

const HISTORICAL_GROSS_AMOUNTS: Record<string, number> = {
  "Starter Ritual:6": 1200,
  "Weekend Coven:12": 2220,
  "True Believer:24": 4056,
}

function loadEnvLocal() {
  try {
    const text = require("node:fs").readFileSync(".env.local", "utf8")
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match) continue
      const [, key, rawValue] = match
      if (process.env[key]) continue
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "")
    }
  } catch {
    // .env.local is optional when env vars are provided by the shell/CI.
  }
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is missing`)
  return value
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(cell)
      cell = ""
    } else if (ch === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else if (ch !== "\r") {
      cell += ch
    }
  }

  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  const headers = (rows.shift() || []).map((h) => h.replace(/^\uFEFF/, "").trim())
  return rows
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]?.trim() || ""])))
}

function parseAmount(value: string): number {
  return Number(value.replace(/[₹,\s]/g, "")) || 0
}

function historicalDiscountAmount(row: CsvRow): number {
  const explicit = parseAmount(row["Discount Amount"] || "")
  if (explicit > 0) return explicit

  const gross = HISTORICAL_GROSS_AMOUNTS[`${row.Pack}:${row.Quantity}`]
  const paid = parseAmount(row.Amount)
  return gross && paid > 0 && gross > paid ? gross - paid : 0
}

function parseDate(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null

  // The Airtable CSV exports timestamps in IST without a timezone marker
  // (e.g. "2024-09-15 10:30am"). Anchor to +05:30 explicitly so the result
  // is independent of the host machine's local timezone.
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(am|pm)$/i)
  if (match) {
    let hour = Number(match[4])
    const minute = Number(match[5])
    const ampm = match[6]!.toLowerCase()
    if (ampm === "pm" && hour !== 12) hour += 12
    if (ampm === "am" && hour === 12) hour = 0
    const yyyy = match[1]
    const mm = match[2]
    const dd = match[3]
    const HH = String(hour).padStart(2, "0")
    const MM = String(minute).padStart(2, "0")
    const istIso = `${yyyy}-${mm}-${dd}T${HH}:${MM}:00+05:30`
    const parsed = new Date(istIso)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function toInt(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function knownPaymentOverride(orderId: string) {
  if (orderId === "order_SYc2pxUSNVSjEx") {
    return {
      customer_phone: "9929307024",
      shipping_address: "Bajrang Gadh, 20, Ball Bairathi Nagar 2nd",
      shipping_city: "Mahesh Nagar, Jaipur",
      shipping_state: "Rajasthan",
      shipping_pincode: "302015",
    }
  }
  return {}
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const url = (process.env.SUPABASE_URL || requireEnv("NEXT_PUBLIC_SUPABASE_URL")).replace(/\/$/, "")
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(init.headers || {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Supabase ${init.method || "GET"} ${path} failed (${response.status}): ${await response.text()}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

async function uploadInvoice(bucket: string, storagePath: string, filePath: string) {
  const bytes = await readFile(filePath)
  await supabaseRequest(`/storage/v1/object/${encodeURIComponent(bucket)}/${storagePath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    },
    body: bytes as any,
  })
}

async function upsertPayment(payment: Record<string, unknown>) {
  await supabaseRequest("/rest/v1/payments?on_conflict=order_id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(payment),
  })
}

async function setInvoiceCounter(maxSeq: number) {
  await supabaseRequest("/rest/v1/invoice_counters?on_conflict=id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ id: "global", current_seq: maxSeq }),
  })
}

async function main() {
  loadEnvLocal()

  const paymentsCsvPath = process.argv[2] || DEFAULT_PAYMENTS_CSV
  const manifestPath = process.argv[3] || DEFAULT_MANIFEST
  const invoiceDir = process.argv[4] || DEFAULT_INVOICE_DIR
  const bucket = process.env.SUPABASE_INVOICE_BUCKET || DEFAULT_BUCKET

  const payments = parseCsv(await readFile(paymentsCsvPath, "utf8"))
  const manifest = parseCsv(await readFile(manifestPath, "utf8")) as unknown as ManifestRow[]
  const paymentsByOrderId = new Map(payments.map((row) => [row["Order ID"], row]))

  let uploaded = 0
  let upserted = 0
  let maxSeq = 0

  for (const invoice of manifest) {
    const row = paymentsByOrderId.get(invoice.orderId)
    if (!row) throw new Error(`No payment CSV row found for ${invoice.orderId}`)

    const invoiceSeq = Number(invoice.invoiceSeq)
    maxSeq = Math.max(maxSeq, invoiceSeq)
    const storagePath = `${String(invoiceSeq).padStart(4, "0")}-${invoice.orderId}.pdf`
    await uploadInvoice(bucket, storagePath, join(invoiceDir, invoice.file))
    uploaded++

    await upsertPayment({
      payment_id: row["Payment ID"] || null,
      order_id: invoice.orderId,
      pack: row.Pack || "",
      quantity: Number(row.Quantity) || 0,
      amount: parseAmount(row.Amount),
      customer_name: row["Customer Name"] || "",
      customer_email: row["Customer Email"] || "",
      customer_phone: row["Customer Phone"] || null,
      full_shipping_address: row["Full Shipping Address"] || null,
      shipping_address: row["Shipping Address"] || null,
      shipping_city: row["Shipping City"] || null,
      shipping_state: invoice.state || row["Shipping State"] || null,
      shipping_pincode: row["Shipping Pincode"] || null,
      paid_at: parseDate(row.Timestamp),
      shipping_status: row["Shipping Status"] || null,
      shiprocket_order_id: row["Shiprocket Order ID"] || null,
      shipment_id: row["Shipment ID"] || null,
      awb_code: row["AWB Code"] || null,
      courier_name: row["Courier Name"] || null,
      estimated_delivery: row["Estimated Delivery"] || null,
      delivered_at: row["Delivered At"] || null,
      invoice_seq: invoiceSeq,
      original_invoice_seq: toInt(invoice.originalInvoiceSeq),
      invoice_no: invoice.invoiceNo,
      invoice_storage_path: storagePath,
      gst_number: invoice.gstNumber || row["GST Number"] || null,
      gst_business_name: invoice.gstBusinessName || row["GST Business Name"] || null,
      promo_code: row["Promo Code"] || null,
      discount_amount: historicalDiscountAmount(row),
      tax_type: invoice.taxType,
      migrated_from: "airtable_payments_csv",
      source_payload: row,
      ...knownPaymentOverride(invoice.orderId),
    })
    upserted++
  }

  await setInvoiceCounter(maxSeq)

  console.log(`Uploaded ${uploaded} invoices to '${bucket}'`)
  console.log(`Upserted ${upserted} payments`)
  console.log(`Set global invoice counter to ${maxSeq}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
