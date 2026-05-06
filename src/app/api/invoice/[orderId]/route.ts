import { NextRequest, NextResponse } from "next/server"
import {
  getRequiredEnv,
  queryAirtableRecords,
} from "@/lib/server/integrations"
import { checkRateLimit, escapeAirtableValue } from "@/lib/server/security"
import { getKVNamespace } from "@/lib/server/kv"
import { generateInvoicePdf } from "@/lib/pdf/generate-invoice"
import {
  downloadSupabaseInvoice,
  getSupabasePaymentByOrderId,
  type SupabasePayment,
} from "@/lib/server/supabase"

// Force dynamic rendering — invoices contain PII and must never be cached
export const dynamic = "force-dynamic"

function invoicePdfResponse(pdf: ArrayBuffer | Uint8Array, orderId: string) {
  return new Response(pdf as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="UNHOLY-Invoice-${orderId}.pdf"`,
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
    },
  })
}

async function generateInvoiceFromSupabase(payment: SupabasePayment) {
  return generateInvoicePdf({
    orderId: payment.order_id,
    paymentId: payment.payment_id || "",
    pack: payment.pack || "",
    quantity: Number(payment.quantity || 0),
    amount: Number(payment.amount || 0),
    customerName: payment.customer_name || "",
    customerEmail: payment.customer_email || "",
    customerPhone: payment.customer_phone || undefined,
    shippingAddress: payment.shipping_address || payment.full_shipping_address || "",
    shippingCity: payment.shipping_city || undefined,
    shippingState: payment.shipping_state || undefined,
    shippingPincode: payment.shipping_pincode || undefined,
    timestamp: payment.paid_at || new Date().toISOString(),
    promoCode: payment.promo_code || undefined,
    discountAmount: Number(payment.discount_amount || 0) || undefined,
    buyerGstNumber: payment.gst_number || undefined,
    buyerBusinessName: payment.gst_business_name || undefined,
    invoiceSeq: payment.invoice_seq || undefined,
    invoiceNumber: payment.invoice_no || undefined,
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Require the customer's email to prove they own this order
    const emailParam = request.nextUrl.searchParams.get("email")?.trim().toLowerCase()
    if (!emailParam) {
      return NextResponse.json({ error: "Email is required" }, { status: 401 })
    }

    // Rate limit per IP (prevents PDF-generation CPU abuse + brute-force guessing)
    const kv = await getKVNamespace()
    const rateLimit = await checkRateLimit(request, {
      bucket: "invoice-download",
      limit: 10,
      windowMs: 60 * 60 * 1000,
    }, kv)
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many invoice requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      )
    }

    // Per-(email, orderId) throttle — prevents guessing orderIds against a known email
    if (kv) {
      const comboKey = `rl:invoice-combo:${emailParam}:${orderId}`
      const existing = await kv.get(comboKey)
      const count = existing ? Number(existing) || 0 : 0
      if (count >= 5) {
        return NextResponse.json(
          { error: "Too many attempts. Try again later." },
          { status: 429, headers: { "Retry-After": "3600" } }
        )
      }
      await kv.put(comboKey, String(count + 1), { expirationTtl: 3600 })
    }

    // Supabase is the new source of truth. It lets corrected historical
    // invoices remain downloadable even when Airtable's API quota is exhausted.
    try {
      const supabasePayment = await getSupabasePaymentByOrderId(orderId)
      if (supabasePayment) {
        const orderEmail = String(supabasePayment.customer_email || "").toLowerCase().trim()
        if (!orderEmail || orderEmail !== emailParam) {
          return NextResponse.json({ error: "Not authorized" }, { status: 403 })
        }

        if (supabasePayment.invoice_storage_path) {
          const storedPdf = await downloadSupabaseInvoice(supabasePayment.invoice_storage_path)
          if (storedPdf) {
            return invoicePdfResponse(storedPdf, orderId)
          }
        }

        const pdfBytes = await generateInvoiceFromSupabase(supabasePayment)
        return invoicePdfResponse(pdfBytes, orderId)
      }
    } catch (error) {
      console.error("Supabase invoice lookup failed, falling back to Airtable:", error)
    }

    const baseId = getRequiredEnv("AIRTABLE_ORDERS_BASE_ID")

    // Look up the payment record
    const records = await queryAirtableRecords({
      baseId,
      tableName: "Payments",
      filterByFormula: `{Order ID} = "${escapeAirtableValue(orderId)}"`,
      maxRecords: 1,
    })

    if (records.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const record = records[0]!
    const fields = record.fields

    // Verify the requester is the order's customer
    const orderEmail = String(fields["Customer Email"] || "").toLowerCase().trim()
    if (!orderEmail || orderEmail !== emailParam) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Serve from the pre-generated attachment stored on the Airtable record when
    // available — avoids redundant PDF generation on every download request.
    // Airtable returns a fresh signed URL on each record query so expiry is not
    // a concern. Falls through to on-demand generation on any fetch failure.
    const rawAttachments = fields["Invoice PDF"]
    if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
      const attachmentUrl = (rawAttachments[0] as { url?: string })?.url
      if (attachmentUrl) {
        try {
          const cached = await fetch(attachmentUrl, {
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
          })
          if (cached.ok) {
            const pdfBuffer = await cached.arrayBuffer()
            return invoicePdfResponse(pdfBuffer, orderId)
          }
        } catch {
          // Timeout or transient network error — fall through to on-demand generation
        }
      }
    }

    const invoiceSeq = Number(fields["Invoice Number"] || 0) || undefined
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
      timestamp: String(fields["Timestamp"] || new Date().toISOString()),
      promoCode: String(fields["Promo Code"] || "") || undefined,
      discountAmount: Number(fields["Discount Amount"] || 0) || undefined,
      buyerGstNumber: String(fields["GST Number"] || fields["GST number"] || "") || undefined,
      buyerBusinessName: String(fields["GST Business Name"] || "") || undefined,
      invoiceSeq,
    })

    // Use the Web standard Response (not NextResponse) — accepts Uint8Array directly
    // and works correctly in both Node.js and Cloudflare Workers runtimes without
    // TypeScript BodyInit type conflicts.
    return invoicePdfResponse(pdfBytes, orderId)
  } catch (error: any) {
    console.error("Invoice generation error:", error?.message || error)
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    )
  }
}
