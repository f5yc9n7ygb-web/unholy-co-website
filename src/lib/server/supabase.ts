type SupabasePaymentRow = {
  payment_id: string | null
  order_id: string
  pack: string
  quantity: number
  amount: number | string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  full_shipping_address: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_pincode: string | null
  paid_at: string | null
  shipping_status: string | null
  shiprocket_order_id: string | null
  shipment_id: string | null
  awb_code: string | null
  courier_name: string | null
  estimated_delivery: string | null
  delivered_at: string | null
  invoice_seq: number | null
  invoice_no: string | null
  invoice_storage_path: string | null
  gst_number: string | null
  gst_business_name: string | null
  promo_code: string | null
  discount_amount: number | string | null
  tax_type: "CGST+SGST" | "IGST" | null
  original_invoice_seq: number | null
  migrated_from: string | null
}

export type SupabasePayment = SupabasePaymentRow

export type SupabaseOrder = {
  id?: string
  razorpay_order_id: string
  customer_email: string | null
  customer_name: string | null
  customer_phone: string | null
  pack: string | null
  quantity: number
  amount: number | string
  status: string
  shipping: Record<string, unknown>
  source_payload: Record<string, unknown>
  email_1_sent_at?: string | null
  email_2_sent_at?: string | null
  converted_at?: string | null
  created_at?: string
  updated_at?: string
}

export type SupabaseContactSubmission = {
  id?: string
  name: string
  email: string
  phone?: string | null
  message: string
  inquiry_type?: string | null
  source?: string | null
  source_payload?: Record<string, unknown>
}

export type SupabaseSubscription = {
  id?: string
  email: string
  name?: string | null
  source?: string | null
  status?: string
  source_payload?: Record<string, unknown>
  confirmed_at?: string
}

export type SupabaseInventory = {
  pack_id: string
  title: string
  available: number
  reserved: number
  sold: number
  is_active: boolean
}

export type SupabasePromoCode = {
  code: string
  discount_type: string
  discount_value: number | string
  min_order?: number | string | null
  usage_limit: number | null
  used_count: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  metadata: Record<string, unknown> | null
}

export type SupabaseRefund = {
  id?: string
  order_id: string
  payment_id?: string | null
  customer_email: string
  customer_name: string
  amount: number
  reason: string
  details: string
  status: string
  source_payload?: Record<string, unknown>
}

const PAYMENT_SELECT = [
  "payment_id",
  "order_id",
  "pack",
  "quantity",
  "amount",
  "customer_name",
  "customer_email",
  "customer_phone",
  "full_shipping_address",
  "shipping_address",
  "shipping_city",
  "shipping_state",
  "shipping_pincode",
  "paid_at",
  "shipping_status",
  "shiprocket_order_id",
  "shipment_id",
  "awb_code",
  "courier_name",
  "estimated_delivery",
  "delivered_at",
  "invoice_seq",
  "invoice_no",
  "invoice_storage_path",
  "gst_number",
  "gst_business_name",
  "promo_code",
  "discount_amount",
  "tax_type",
  "original_invoice_seq",
  "migrated_from",
].join(",")

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "")
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return { url, serviceKey }
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const config = getSupabaseConfig()
  if (!config) return null

  return fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  })
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig())
}

async function supabaseJson<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const response = await supabaseFetch(path, init)
  if (!response) return null
  if (!response.ok) {
    throw new Error(`Supabase ${init.method || "GET"} ${path} failed (${response.status}): ${await response.text()}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) as T : null
}

function jsonHeaders(init?: RequestInit) {
  return {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  }
}

/**
 * Escape PostgREST ilike wildcards (`_`, `%`) and the escape char `\` so a
 * caller-supplied value matches literally. Without this, `hello_world@x.com`
 * would also match `helloAworld@x.com`.
 */
function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/[_%]/g, "\\$&")
}

export async function getSupabasePaymentByOrderId(orderId: string): Promise<SupabasePayment | null> {
  const params = new URLSearchParams({
    select: PAYMENT_SELECT,
    order_id: `eq.${orderId}`,
    limit: "1",
  })
  const response = await supabaseFetch(`/rest/v1/payments?${params.toString()}`)
  if (!response) return null
  if (!response.ok) throw new Error(`Supabase payment lookup failed (${response.status}): ${await response.text()}`)

  const rows = await response.json() as SupabasePaymentRow[]
  return rows[0] || null
}

export async function getSupabasePaymentByPaymentId(paymentId: string): Promise<SupabasePayment | null> {
  const params = new URLSearchParams({
    select: PAYMENT_SELECT,
    payment_id: `eq.${paymentId}`,
    limit: "1",
  })
  const response = await supabaseFetch(`/rest/v1/payments?${params.toString()}`)
  if (!response) return null
  if (!response.ok) throw new Error(`Supabase payment lookup failed (${response.status}): ${await response.text()}`)

  const rows = await response.json() as SupabasePaymentRow[]
  return rows[0] || null
}

export async function getSupabasePaymentByAwb(awbCode: string): Promise<SupabasePayment | null> {
  const params = new URLSearchParams({
    select: PAYMENT_SELECT,
    awb_code: `eq.${awbCode}`,
    limit: "1",
  })
  const response = await supabaseFetch(`/rest/v1/payments?${params.toString()}`)
  if (!response) return null
  if (!response.ok) throw new Error(`Supabase payment AWB lookup failed (${response.status}): ${await response.text()}`)

  const rows = await response.json() as SupabasePaymentRow[]
  return rows[0] || null
}

export async function getSupabasePaymentsByEmail(email: string, limit = 20): Promise<SupabasePayment[]> {
  const params = new URLSearchParams({
    select: PAYMENT_SELECT,
    customer_email: `ilike.${escapeIlike(email)}`,
    order: "paid_at.desc.nullslast",
    limit: String(limit),
  })
  const response = await supabaseFetch(`/rest/v1/payments?${params.toString()}`)
  if (!response) return []
  if (!response.ok) throw new Error(`Supabase payment email lookup failed (${response.status}): ${await response.text()}`)

  return response.json() as Promise<SupabasePaymentRow[]>
}

export async function getSupabasePaymentsWithShiprocketOrder(limit = 50): Promise<SupabasePayment[]> {
  const params = new URLSearchParams({
    select: PAYMENT_SELECT,
    shiprocket_order_id: "not.is.null",
    order: "paid_at.desc.nullslast",
    limit: String(limit),
  })
  const response = await supabaseFetch(`/rest/v1/payments?${params.toString()}`)
  if (!response) return []
  if (!response.ok) throw new Error(`Supabase Shiprocket payment lookup failed (${response.status}): ${await response.text()}`)

  return response.json() as Promise<SupabasePaymentRow[]>
}

export async function getSupabasePaymentsByShippingStatus(status: string, limit = 50): Promise<SupabasePayment[]> {
  const params = new URLSearchParams({
    select: PAYMENT_SELECT,
    shipping_status: `eq.${status}`,
    order: "paid_at.desc.nullslast",
    limit: String(limit),
  })
  const response = await supabaseFetch(`/rest/v1/payments?${params.toString()}`)
  if (!response) return []
  if (!response.ok) throw new Error(`Supabase payment status lookup failed (${response.status}): ${await response.text()}`)

  return response.json() as Promise<SupabasePaymentRow[]>
}

export async function downloadSupabaseInvoice(path: string, bucket = "invoices"): Promise<ArrayBuffer | null> {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/")
  const response = await supabaseFetch(`/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`)
  if (!response) return null
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Supabase invoice download failed (${response.status}): ${await response.text()}`)
  return response.arrayBuffer()
}

export async function upsertSupabaseOrder(order: Omit<SupabaseOrder, "id" | "created_at" | "updated_at">): Promise<SupabaseOrder | null> {
  const rows = await supabaseJson<SupabaseOrder[]>("/rest/v1/orders?on_conflict=razorpay_order_id", {
    method: "POST",
    headers: jsonHeaders({ headers: { Prefer: "resolution=merge-duplicates,return=representation" } }),
    body: JSON.stringify(order),
  })
  return rows?.[0] || null
}

export async function getSupabaseOrderByRazorpayOrderId(orderId: string): Promise<SupabaseOrder | null> {
  const params = new URLSearchParams({
    select: "*",
    razorpay_order_id: `eq.${orderId}`,
    limit: "1",
  })
  const rows = await supabaseJson<SupabaseOrder[]>(`/rest/v1/orders?${params.toString()}`)
  return rows?.[0] || null
}

export async function getSupabaseOrdersByEmailAndStatuses(
  email: string,
  statuses: string[],
  limit = 50,
): Promise<SupabaseOrder[]> {
  const params = new URLSearchParams({
    select: "*",
    customer_email: `ilike.${escapeIlike(email)}`,
    status: `in.(${statuses.join(",")})`,
    order: "created_at.desc",
    limit: String(limit),
  })
  return (await supabaseJson<SupabaseOrder[]>(`/rest/v1/orders?${params.toString()}`)) || []
}

export async function getSupabaseOrdersByStatusesBefore(
  statuses: string[],
  beforeIso: string,
  limit = 50,
  dateColumn: "created_at" | "updated_at" | "email_1_sent_at" | "email_2_sent_at" = "created_at",
): Promise<SupabaseOrder[]> {
  const params = new URLSearchParams({
    select: "*",
    status: `in.(${statuses.join(",")})`,
    [dateColumn]: `lt.${beforeIso}`,
    order: `${dateColumn}.asc`,
    limit: String(limit),
  })
  return (await supabaseJson<SupabaseOrder[]>(`/rest/v1/orders?${params.toString()}`)) || []
}

export async function hasSupabaseConvertedOrderForEmail(email: string): Promise<boolean> {
  if (!email) return false
  const params = new URLSearchParams({
    select: "razorpay_order_id",
    customer_email: `ilike.${escapeIlike(email)}`,
    status: `eq.converted`,
    limit: "1",
  })
  const rows = await supabaseJson<Array<{ razorpay_order_id: string }>>(`/rest/v1/orders?${params.toString()}`)
  return Boolean(rows && rows.length > 0)
}

export async function insertSupabaseContactSubmission(
  submission: Omit<SupabaseContactSubmission, "id">,
): Promise<SupabaseContactSubmission | null> {
  const rows = await supabaseJson<SupabaseContactSubmission[]>("/rest/v1/contact_submissions", {
    method: "POST",
    headers: jsonHeaders({ headers: { Prefer: "return=representation" } }),
    body: JSON.stringify(submission),
  })
  return rows?.[0] || null
}

export async function upsertSupabaseSubscription(
  subscription: Omit<SupabaseSubscription, "id">,
): Promise<SupabaseSubscription | null> {
  const rows = await supabaseJson<SupabaseSubscription[]>("/rest/v1/subscriptions?on_conflict=email", {
    method: "POST",
    headers: jsonHeaders({ headers: { Prefer: "resolution=merge-duplicates,return=representation" } }),
    body: JSON.stringify(subscription),
  })
  return rows?.[0] || null
}

export async function updateSupabaseOrderByRazorpayOrderId(
  orderId: string,
  fields: Partial<Omit<SupabaseOrder, "id" | "razorpay_order_id" | "created_at" | "updated_at">>,
): Promise<SupabaseOrder | null> {
  const params = new URLSearchParams({ razorpay_order_id: `eq.${orderId}` })
  const rows = await supabaseJson<SupabaseOrder[]>(`/rest/v1/orders?${params.toString()}`, {
    method: "PATCH",
    headers: jsonHeaders({ headers: { Prefer: "return=representation" } }),
    body: JSON.stringify(fields),
  })
  return rows?.[0] || null
}

export async function upsertSupabasePayment(payment: Record<string, unknown>): Promise<SupabasePayment | null> {
  const rows = await supabaseJson<SupabasePayment[]>("/rest/v1/payments?on_conflict=order_id", {
    method: "POST",
    headers: jsonHeaders({ headers: { Prefer: "resolution=merge-duplicates,return=representation" } }),
    body: JSON.stringify(payment),
  })
  return rows?.[0] || null
}

export async function updateSupabasePaymentByOrderId(
  orderId: string,
  fields: Partial<Record<keyof SupabasePaymentRow | string, unknown>>,
): Promise<SupabasePayment | null> {
  const params = new URLSearchParams({ order_id: `eq.${orderId}` })
  const rows = await supabaseJson<SupabasePayment[]>(`/rest/v1/payments?${params.toString()}`, {
    method: "PATCH",
    headers: jsonHeaders({ headers: { Prefer: "return=representation" } }),
    body: JSON.stringify(fields),
  })
  return rows?.[0] || null
}

export async function getSupabaseInventory(packId: string): Promise<SupabaseInventory | null> {
  const params = new URLSearchParams({
    select: "*",
    pack_id: `eq.${packId}`,
    is_active: "eq.true",
    limit: "1",
  })
  const rows = await supabaseJson<SupabaseInventory[]>(`/rest/v1/inventory?${params.toString()}`)
  return rows?.[0] || null
}

export async function updateSupabaseInventory(
  packId: string,
  fields: Partial<Pick<SupabaseInventory, "available" | "reserved" | "sold" | "is_active" | "title">>,
): Promise<SupabaseInventory | null> {
  const params = new URLSearchParams({ pack_id: `eq.${packId}` })
  const rows = await supabaseJson<SupabaseInventory[]>(`/rest/v1/inventory?${params.toString()}`, {
    method: "PATCH",
    headers: jsonHeaders({ headers: { Prefer: "return=representation" } }),
    body: JSON.stringify(fields),
  })
  return rows?.[0] || null
}

export async function getSupabasePromoCode(code: string): Promise<SupabasePromoCode | null> {
  const params = new URLSearchParams({
    select: "*",
    code: `eq.${code.trim().toUpperCase()}`,
    limit: "1",
  })
  const rows = await supabaseJson<SupabasePromoCode[]>(`/rest/v1/promo_codes?${params.toString()}`)
  return rows?.[0] || null
}

export async function updateSupabasePromoCode(
  code: string,
  fields: Partial<Pick<SupabasePromoCode, "used_count" | "is_active" | "metadata">>,
): Promise<SupabasePromoCode | null> {
  const params = new URLSearchParams({ code: `eq.${code.trim().toUpperCase()}` })
  const rows = await supabaseJson<SupabasePromoCode[]>(`/rest/v1/promo_codes?${params.toString()}`, {
    method: "PATCH",
    headers: jsonHeaders({ headers: { Prefer: "return=representation" } }),
    body: JSON.stringify(fields),
  })
  return rows?.[0] || null
}

export async function getSupabaseRefundByOrderId(orderId: string): Promise<SupabaseRefund | null> {
  const params = new URLSearchParams({
    select: "*",
    order_id: `eq.${orderId}`,
    limit: "1",
  })
  const rows = await supabaseJson<SupabaseRefund[]>(`/rest/v1/refunds?${params.toString()}`)
  return rows?.[0] || null
}

export async function insertSupabaseRefund(refund: Omit<SupabaseRefund, "id">): Promise<SupabaseRefund | null> {
  const rows = await supabaseJson<SupabaseRefund[]>("/rest/v1/refunds", {
    method: "POST",
    headers: jsonHeaders({ headers: { Prefer: "return=representation" } }),
    body: JSON.stringify(refund),
  })
  return rows?.[0] || null
}

export async function logErrorToSupabase(context: string, error: unknown, details: Record<string, unknown> = {}) {
  try {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error)
    const stack = error instanceof Error ? error.stack || "" : ""
    // Severity is a top-level column; strip it from the details jsonb so we don't store it twice.
    const { severity: severityFromDetails, ...detailsWithoutSeverity } = details
    await supabaseJson("/rest/v1/error_logs", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        context,
        severity: severityFromDetails || "error",
        message: message || "Unknown error",
        stack,
        details: detailsWithoutSeverity,
      }),
    })
  } catch (err) {
    console.error("Failed to log error to Supabase:", err)
  }
}

export async function getNextSupabaseInvoiceSeq(): Promise<number | null> {
  const result = await supabaseJson<number>("/rest/v1/rpc/next_invoice_seq", {
    method: "POST",
    headers: jsonHeaders(),
    body: "{}",
  })
  return typeof result === "number" ? result : null
}

export async function uploadSupabaseInvoice(
  path: string,
  bytes: Uint8Array,
  bucket = process.env.SUPABASE_INVOICE_BUCKET || "invoices",
): Promise<void> {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/")
  const response = await supabaseFetch(`/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    },
    body: bytes as any,
  })
  if (!response) return
  if (!response.ok) throw new Error(`Supabase invoice upload failed (${response.status}): ${await response.text()}`)
}
