import { GST_RATE } from "@/lib/shop/catalog"
import { createPaidReceiptPricing, type ReceiptPricing } from "@/lib/shop/receipt"

export type OrderConfirmationOptions = {
  customerName: string
  customerEmail: string
  customerPhone?: string
  orderId: string
  paymentId: string
  packTitle: string
  packQty: number
  /** GST-inclusive amount actually paid after discount. */
  packPrice: number
  pricing?: ReceiptPricing
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingPincode: string
  promoCode?: string
  discountAmount?: number
  buyerGstNumber?: string
  buyerBusinessName?: string
  /** Paid add-ons (e.g. Cursed Note, Unholy Ledger), itemized for the customer. */
  addOns?: Array<{ id?: "cursed_note" | "unholy_ledger"; title: string; price: number; detail?: string }>
}

function formatCurrency(price: number) {
  return price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function buildOrderConfirmationHtml(o: OrderConfirmationOptions): string {
  const customerFirstName = escapeHtml(o.customerName.split(" ")[0] || "Customer")
  const blood = "#B00020"
  const bg = "#0a0a0a"
  const card = "#111111"
  const border = "#1e1e1e"
  const textMain = "#F6F6F6"
  const textMuted = "#888888"
  const textDim = "#555555"

  const pricing = getConfirmationPricing(o)
  const priceFormatted = `₹${formatCurrency(pricing.total)}`
  const gstFormatted = `₹${formatCurrency(pricing.gstAmount)}`
  const basePriceFormatted = `₹${formatCurrency(pricing.subtotal)}`
  const grossPriceFormatted = `₹${formatCurrency(pricing.grossTotal)}`
  const discountFormatted = `−₹${formatCurrency(pricing.discountAmount)}`
  const gstLabel = `GST (${GST_RATE * 100}%)`
  const addressBlock = [o.shippingAddress, o.shippingCity, o.shippingState, o.shippingPincode]
    .filter(Boolean)
    .join(", ")

  const row = (label: string, value: string, mono = false) => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid ${border}; color:${textMuted}; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; width:40%;">${escapeHtml(label)}</td>
      <td style="padding:12px 0; border-bottom:1px solid ${border}; color:${textMain}; font-size:13px; text-align:right; ${mono ? "font-family:monospace;" : ""}">${escapeHtml(value)}</td>
    </tr>`

  const step = (num: string, title: string, desc: string) => `
    <tr>
      <td style="padding:14px 0; border-bottom:1px solid ${border}; vertical-align:top; width:40px;">
        <span style="font-family:'Cinzel',Georgia,serif; font-size:12px; font-weight:700; color:${blood}; opacity:0.7;">${num}</span>
      </td>
      <td style="padding:14px 0; border-bottom:1px solid ${border}; padding-left:16px;">
        <div style="font-size:13px; font-weight:600; color:${textMain};">${title}</div>
        <div style="font-size:12px; color:${textMuted}; margin-top:3px;">${desc}</div>
      </td>
    </tr>`
  const discountRows = pricing.discountAmount > 0
    ? `${row("Gross Total", grossPriceFormatted)}
                ${row(o.promoCode ? `Discount (${o.promoCode})` : "Discount", discountFormatted)}`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Order Confirmed — UNHOLY CO.</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
    :root { color-scheme: light; }
  </style>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:Arial,Helvetica,sans-serif;color-scheme:light;">

  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${bg};">
    The ritual is complete. Your BloodThirst is confirmed and on its way.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td style="padding-bottom:32px; text-align:center;">
              <div style="font-family:'Cinzel',Georgia,serif; font-size:13px; font-weight:700; letter-spacing:0.25em; color:${textMuted}; text-transform:uppercase;">UNHOLY CO.</div>
              <div style="margin-top:4px; height:1px; background:${blood}; opacity:0.3;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px; background:${card}; border-radius:8px 8px 0 0; text-align:center; border-bottom:2px solid ${blood};">
              <div style="font-family:'Cinzel',Georgia,serif; font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:${blood}; margin-bottom:16px;">Order Confirmed</div>
              <h1 style="margin:0; font-family:'Cinzel',Georgia,serif; font-size:32px; font-weight:700; color:${textMain}; line-height:1.2;">The ritual is<br>complete.</h1>
              <p style="margin:16px 0 0; font-size:14px; color:${textMuted}; line-height:1.6;">
                Your BloodThirst is confirmed, ${customerFirstName}.<br>
                We'll have it packed and on its way within 24–48 hours.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px; background:${card}; border-top:1px solid ${border};">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.35em; color:${textDim}; margin-bottom:16px;">Order Details</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row("Product", o.packTitle)}
                ${row("Quantity", `${o.packQty} cans`)}
                ${discountRows}
                ${row("Subtotal", basePriceFormatted)}
                ${row(gstLabel, gstFormatted)}
                ${row("Total Paid", priceFormatted)}
                ${row("Order ID", o.orderId, true)}
                ${row("Payment ID", o.paymentId, true)}
              </table>
            </td>
          </tr>

          ${(o.addOns && o.addOns.length) ? `
          <tr>
            <td style="padding:28px 32px; background:${card}; border-top:1px solid ${border};">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.35em; color:${textDim}; margin-bottom:16px;">Add-Ons</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${o.addOns.map((a) => row(a.detail ? `${a.title} (${a.detail})` : a.title, `₹${formatCurrency(a.price)}`)).join("")}
              </table>
            </td>
          </tr>` : ""}

          <tr>
            <td style="padding:28px 32px; background:${card}; border-top:1px solid ${border};">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.35em; color:${textDim}; margin-bottom:12px;">Delivering To</div>
              <div style="font-size:13px; color:${textMuted}; line-height:1.7;">${escapeHtml(addressBlock)}</div>
            </td>
          </tr>

          ${o.buyerGstNumber ? `
          <tr>
            <td style="padding:28px 32px; background:${card}; border-top:1px solid ${border};">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.35em; color:${textDim}; margin-bottom:16px;">GST Details</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row("GST Number", o.buyerGstNumber, true)}
                ${o.buyerBusinessName ? row("Business Name", o.buyerBusinessName) : ""}
              </table>
            </td>
          </tr>` : ""}

          <tr>
            <td style="padding:28px 32px; background:${card}; border-top:1px solid ${border}; border-radius:0 0 8px 8px;">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.35em; color:${textDim}; margin-bottom:16px;">What Happens Next</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${step("01", "Confirmation", "This email confirms your order. Keep it for your records.")}
                ${step("02", "Dispatch", "Packed and handed to the courier within 24–48 hours.")}
                ${step("03", "Track & Deliver", "Track your order anytime — we'll email you when it ships.")}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px; text-align:center;">
              <a href="https://theunholy.co/track?order=${encodeURIComponent(o.orderId)}" style="display:inline-block; background:${blood}; color:#fff; text-decoration:none; font-size:12px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; padding:14px 32px; border-radius:4px;">
                Track Your Order
              </a>
              <div style="margin-top:14px;">
                <a href="https://theunholy.co/api/invoice/${encodeURIComponent(o.orderId)}?email=${encodeURIComponent(o.customerEmail)}" style="font-size:11px; color:${textMuted}; text-decoration:underline;">
                  Download GST Invoice (PDF)
                </a>
              </div>
              <div style="margin-top:8px;">
                <a href="https://theunholy.co/bloodverse" style="font-size:11px; color:${textMuted}; text-decoration:underline;">
                  Explore the Bloodverse
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 40px; text-align:center;">
              <div style="height:1px; background:${border}; margin-bottom:24px;"></div>
              <div style="font-size:11px; color:${textDim}; line-height:1.7;">
                Questions? Contact us at <a href="mailto:rituals@theunholy.co" style="color:${textMuted}; text-decoration:none;">rituals@theunholy.co</a><br><br>
                <span style="color:${textDim};">UNHOLY CO. · Himalayan mineral water for the counterculture.<br>
                © ${new Date().getFullYear()} UNHOLY CO. All rights reserved.</span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

export function buildOrderConfirmationText(o: OrderConfirmationOptions): string {
  const pricing = getConfirmationPricing(o)
  const gstLabel = `GST (${GST_RATE * 100}%)`
  const discountLines = pricing.discountAmount > 0
    ? `Gross Total: ₹${formatCurrency(pricing.grossTotal)}
${o.promoCode ? `Discount (${o.promoCode})` : "Discount"}: −₹${formatCurrency(pricing.discountAmount)}
`
    : ""
  let text = `ORDER CONFIRMED — UNHOLY CO.

The ritual is complete, ${o.customerName.split(" ")[0]}.

Your BloodThirst is confirmed and will be packed and dispatched within 24–48 hours.

ORDER DETAILS
-------------
Product:    ${o.packTitle}
Quantity:   ${o.packQty} cans
${discountLines}Subtotal:   ₹${formatCurrency(pricing.subtotal)}
${gstLabel}:  ₹${formatCurrency(pricing.gstAmount)}
Total Paid: ₹${formatCurrency(pricing.total)}
Order ID:   ${o.orderId}
Payment ID: ${o.paymentId}
${o.addOns && o.addOns.length ? `
ADD-ONS
-------
${o.addOns.map((a) => `${a.title}${a.detail ? ` (${a.detail})` : ""}: ₹${formatCurrency(a.price)}`).join("\n")}
` : ""}
DELIVERING TO
-------------
${[o.shippingAddress, o.shippingCity, o.shippingState, o.shippingPincode].filter(Boolean).join(", ")}
`

  if (o.buyerGstNumber) {
    text += `
GST DETAILS
-----------
GST Number: ${o.buyerGstNumber}${o.buyerBusinessName ? `\nBusiness Name: ${o.buyerBusinessName}` : ""}
`
  }

  text += `
WHAT HAPPENS NEXT
-----------------
01 — This email confirms your order.
02 — Packed and dispatched within 24–48 hours.
03 — Track your order anytime — we'll email you when it ships.

TRACK YOUR ORDER
https://theunholy.co/track?order=${o.orderId}

DOWNLOAD GST INVOICE
https://theunholy.co/api/invoice/${o.orderId}?email=${encodeURIComponent(o.customerEmail)}

Questions? rituals@theunholy.co

UNHOLY CO. — Himalayan mineral water for the counterculture.
`
  return text
}

function getConfirmationPricing(options: OrderConfirmationOptions) {
  return options.pricing || createPaidReceiptPricing(options.packPrice, options.discountAmount)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
