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
}

export type SupabasePayment = SupabasePaymentRow

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

export async function getSupabasePaymentsByEmail(email: string, limit = 20): Promise<SupabasePayment[]> {
  const params = new URLSearchParams({
    select: PAYMENT_SELECT,
    customer_email: `ilike.${email}`,
    order: "paid_at.desc.nullslast",
    limit: String(limit),
  })
  const response = await supabaseFetch(`/rest/v1/payments?${params.toString()}`)
  if (!response) return []
  if (!response.ok) throw new Error(`Supabase payment email lookup failed (${response.status}): ${await response.text()}`)

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
