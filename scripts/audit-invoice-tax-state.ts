#!/usr/bin/env -S npx tsx

import { readFileSync } from "node:fs"

try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m?.[1] && !process.env[m[1]]) process.env[m[1]] = m[2]!.replace(/^["']|["']$/g, "").trim()
  }
} catch { /* rely on shell env */ }

const token = process.env.AIRTABLE_TOKEN
const baseId = process.env.AIRTABLE_ORDERS_BASE_ID
if (!token || !baseId) throw new Error("Missing Airtable env vars")

async function fetchWithRetry(url: string, init: RequestInit, attempts = 5): Promise<Response> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init)
      if (res.status !== 429 && res.status < 500) return res
      lastError = new Error(`HTTP ${res.status}: ${await res.text()}`)
    } catch (err) {
      lastError = err
    }
    if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function main() {
  const records: any[] = []
  let offset: string | undefined
  do {
    const params = new URLSearchParams({ filterByFormula: "{Invoice Number}", maxRecords: "100" })
    if (offset) params.set("offset", offset)
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent("Payments")}?${params}`
    const res = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json() as { records: any[]; offset?: string }
    records.push(...data.records)
    offset = data.offset
  } while (offset)

  const rows = records.map((r) => ({
    recordId: r.id,
    orderId: r.fields["Order ID"],
    name: r.fields["Customer Name"],
    invoice: r.fields["Invoice Number"],
    state: r.fields["Shipping State"],
    city: r.fields["Shipping City"],
    pincode: r.fields["Shipping Pincode"],
  }))
  console.log(JSON.stringify(rows, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
