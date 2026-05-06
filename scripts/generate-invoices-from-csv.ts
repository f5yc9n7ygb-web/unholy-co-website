#!/usr/bin/env -S node -r ./scripts/register-ts-paths.cjs ./node_modules/sucrase/bin/sucrase-node

import { mkdir, writeFile } from "node:fs/promises"
import { basename, join } from "node:path"
import { spawn } from "node:child_process"
import { generateInvoicePdf } from "../src/lib/pdf/generate-invoice"

const DEFAULT_INPUT = "/Users/aakashsingh/Downloads/Payments-Grid view.csv"
const DEFAULT_OUTPUT = "/Users/aakashsingh/Downloads/corrected-unholy-invoices"

type CsvRow = Record<string, string>

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
]

function findState(value: string): string {
  const normalized = value.toLowerCase()
  return INDIAN_STATES.find((state) => {
    const pattern = new RegExp(`\\b${state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
    return pattern.test(normalized)
  }) || ""
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
  const clean = value.replace(/[₹,\s]/g, "")
  return Number(clean) || 0
}

function parseDate(value: string): Date {
  const raw = value.trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(am|pm)$/i)
  if (m) {
    let hour = Number(m[4])
    const minute = Number(m[5])
    const ampm = m[6]!.toLowerCase()
    if (ampm === "pm" && hour !== 12) hour += 12
    if (ampm === "am" && hour === 12) hour = 0
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hour, minute)
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid Timestamp: ${value}`)
  return parsed
}

function financialYearStart(date: Date): number {
  return date.getMonth() + 1 >= 4 ? date.getFullYear() : date.getFullYear() - 1
}

function sequenceDate(row: CsvRow, index: number): Date {
  if (row.Timestamp) return parseDate(row.Timestamp)

  const invoiceNumber = Number(row["Invoice Number"])
  if (invoiceNumber > 0) {
    // Offline orders in the export have no timestamp. Keep them near the
    // surrounding April 2 records by falling back to their exported sequence.
    return new Date(2026, 3, 2, 23, invoiceNumber, index)
  }

  throw new Error(`Missing Timestamp for row: ${JSON.stringify(row)}`)
}

function parseAddress(row: CsvRow) {
  const full = row["Full Shipping Address"] || ""
  const parts = full.split(",").map((p) => p.trim()).filter(Boolean)
  const pincode = row["Shipping Pincode"] || full.match(/\b\d{6}\b/)?.[0] || ""
  const state = row["Shipping State"] || findState(full)
  const pincodeIndex = parts.findIndex((p) => p.includes(pincode))
  const stateIndex = parts.findIndex((p) => findState(p) === state)
  const city = row["Shipping City"] || (
    stateIndex > 0 ? parts[stateIndex - 1]!
      : pincodeIndex > 1 ? parts[pincodeIndex - 2]!
        : ""
  )
  const address = row["Shipping Address"] || (
    city ? parts.slice(0, Math.max(0, parts.indexOf(city))).join(", ") : full
  )
  return { address: address || full, city, state, pincode }
}

function normalizeGst(row: CsvRow) {
  const orderId = row["Order ID"]
  const name = row["Customer Name"].toLowerCase()
  if (orderId === "order_SYeXZXiNo6UrEA" || name.includes("anvita")) {
    return {
      gstNumber: "09AAHCA9517A1ZT",
      businessName: "ANVITA CONSTRUCTIONS (I) PVT LTD",
    }
  }
  return {
    gstNumber: row["GST Number"] || row["GST number"] || "",
    businessName: row["GST Business Name"] || "",
  }
}

function legacyInvoiceNumber(orderId: string, timestamp: Date, invoiceSeq: number): string {
  const fyStart = financialYearStart(timestamp)
  const fyEnd = fyStart + 1
  const fy = `${String(fyStart).slice(2)}-${String(fyEnd).slice(2)}`
  const suffix = orderId.replace(/^order_/, "").slice(-6).toUpperCase()
  return `UHC/${fy}/${suffix}/${invoiceSeq}`
}

function taxType(state: string, gstNumber: string) {
  const stateCode = gstNumber.slice(0, 2)
  if (stateCode && stateCode !== "09") return "IGST"
  if (stateCode === "09") return "CGST+SGST"
  if (state && !/^uttar pradesh$/i.test(state)) return "IGST"
  return "CGST+SGST"
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

async function zipDirectory(dir: string, zipPath: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("zip", ["-r", zipPath, basename(dir)], {
      cwd: join(dir, ".."),
      stdio: ["ignore", "ignore", "pipe"],
    })
    let err = ""
    child.stderr.on("data", (chunk) => { err += chunk })
    child.on("error", reject)
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(err || `zip exited ${code}`)))
  })
}

async function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT
  const outputDir = process.argv[3] || DEFAULT_OUTPUT
  const csv = await import("node:fs/promises").then((fs) => fs.readFile(inputPath, "utf8"))
  const rows = parseCsv(csv)
    .map((row, index) => ({ row, date: sequenceDate(row, index) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const manifest: Array<Record<string, string | number>> = []
  await mkdir(outputDir, { recursive: true })

  for (const [index, { row, date }] of rows.entries()) {
    const orderId = row["Order ID"]
    const originalInvoiceSeq = Number(row["Invoice Number"]) || ""
    const invoiceSeq = index + 1
    if (!orderId) throw new Error(`Missing order id for row: ${JSON.stringify(row)}`)

    const address = parseAddress(row)
    const gst = normalizeGst(row)
    const invoiceNo = legacyInvoiceNumber(orderId, date, invoiceSeq)
    const pdfBytes = await generateInvoicePdf({
      orderId,
      paymentId: row["Payment ID"],
      pack: row.Pack,
      quantity: Number(row.Quantity) || 0,
      amount: parseAmount(row.Amount),
      customerName: row["Customer Name"],
      customerEmail: row["Customer Email"],
      customerPhone: row["Customer Phone"] || undefined,
      shippingAddress: address.address,
      shippingCity: address.city || undefined,
      shippingState: address.state || undefined,
      shippingPincode: address.pincode || undefined,
      timestamp: date.toISOString(),
      promoCode: row["Promo Code"] || undefined,
      discountAmount: parseAmount(row["Discount Amount"] || ""),
      buyerGstNumber: gst.gstNumber || undefined,
      buyerBusinessName: gst.businessName || undefined,
      invoiceSeq,
      invoiceNumber: invoiceNo,
    })

    const filename = `${String(invoiceSeq).padStart(2, "0")}-${orderId}.pdf`
    await writeFile(join(outputDir, filename), pdfBytes)
    manifest.push({
      invoiceSeq,
      originalInvoiceSeq,
      invoiceNo,
      orderId,
      customerName: row["Customer Name"],
      state: address.state,
      gstNumber: gst.gstNumber,
      gstBusinessName: gst.businessName,
      taxType: taxType(address.state, gst.gstNumber),
      file: filename,
    })
  }

  const manifestCsv = [
    Object.keys(manifest[0] || {}).join(","),
    ...manifest.map((row) => Object.values(row).map(escapeCsv).join(",")),
  ].join("\n")
  await writeFile(join(outputDir, "manifest.csv"), manifestCsv)

  const zipPath = `${outputDir}.zip`
  await zipDirectory(outputDir, zipPath)
  console.log(`Generated ${rows.length} invoices`)
  console.log(outputDir)
  console.log(zipPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
