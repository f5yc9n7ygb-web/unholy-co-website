import { NextRequest, NextResponse } from "next/server"
import {
  getRequiredEnv,
  queryAirtableRecords,
} from "@/lib/server/integrations"
import { escapeAirtableValue } from "@/lib/server/security"
import { generateInvoicePdf } from "@/lib/pdf/generate-invoice"

// Force dynamic rendering — invoices contain PII and must never be cached
export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
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

    const fields = records[0]!.fields
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
    })

    // Use the Web standard Response (not NextResponse) — accepts Uint8Array directly
    // and works correctly in both Node.js and Cloudflare Workers runtimes without
    // TypeScript BodyInit type conflicts.
    return new Response(pdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="UNHOLY-Invoice-${orderId}.pdf"`,
        "Cache-Control": "private, no-store, no-cache, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("Invoice generation error:", error?.message || error)
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    )
  }
}
