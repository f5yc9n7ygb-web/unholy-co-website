import { escapeHtml } from "@/lib/server/security"

export type RefundRequestOptions = {
  customerName: string
  orderId: string
  pack: string
  reason: string
  trackUrl: string
}

export function buildRefundRequestHtml(o: RefundRequestOptions): string {
  const blood = "#B00020"
  const bg = "#0a0a0a"
  const card = "#111111"
  const border = "#1e1e1e"
  const textMain = "#F6F6F6"
  const textMuted = "#888888"

  const name = escapeHtml(o.customerName)
  const orderId = escapeHtml(o.orderId)
  const pack = escapeHtml(o.pack)
  const reason = escapeHtml(o.reason)

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid ${border}; color:${textMuted}; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; width:40%;">${label}</td>
      <td style="padding:12px 0; border-bottom:1px solid ${border}; color:${textMain}; font-size:13px; text-align:right;">${value}</td>
    </tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:${bg}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};">
<tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

  <!-- Logo -->
  <tr><td style="padding-bottom:32px; text-align:center;">
    <span style="font-family:'Cinzel',Georgia,serif; font-size:14px; font-weight:700; letter-spacing:0.35em; color:${blood};">UNHOLY CO.</span>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:${card}; border:1px solid ${border}; border-radius:12px; padding:40px 32px;">

    <p style="margin:0 0 8px; font-family:'Cinzel',Georgia,serif; font-size:22px; font-weight:700; color:${textMain}; text-align:center;">Refund request received.</p>
    <p style="margin:0 0 28px; font-size:13px; color:${textMuted}; text-align:center; line-height:1.6;">
      ${name}, we've received your refund request and our team will review it within 24–48 hours.
    </p>

    <!-- Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${border};">
      ${row("Order ID", orderId)}
      ${row("Product", pack)}
      ${row("Reason", reason)}
      ${row("Status", "Under Review")}
    </table>

    <p style="margin:28px 0 0; font-size:12px; color:${textMuted}; line-height:1.6; text-align:center;">
      We'll email you once a decision is made. If approved, refunds are processed within 5–7 business days to your original payment method.
    </p>

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding-top:28px; text-align:center;">
    <p style="margin:0 0 6px; font-size:11px; color:${textMuted};">Need help? Contact us at rituals@theunholy.co</p>
    <p style="margin:0; font-family:'Cinzel',Georgia,serif; font-size:10px; letter-spacing:0.3em; color:${blood}55;">UNHOLY CO. STAY UNHOLY.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export function buildRefundRequestText(o: RefundRequestOptions): string {
  return `UNHOLY CO.

Refund request received.

${o.customerName}, we've received your refund request and our team will review it within 24–48 hours.

Order ID: ${o.orderId}
Product: ${o.pack}
Reason: ${o.reason}
Status: Under Review

We'll email you once a decision is made. If approved, refunds are processed within 5–7 business days to your original payment method.

Need help? Contact us at rituals@theunholy.co

UNHOLY CO. STAY UNHOLY.`
}
