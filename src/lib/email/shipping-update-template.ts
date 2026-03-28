import { escapeHtml } from "@/lib/server/security"

export type ShippingUpdateOptions = {
  customerName: string
  status: string
  awbCode: string
  courierName: string
  etd: string | null
  trackingUrl: string
  isDelivered: boolean
}

export function buildShippingUpdateHtml(o: ShippingUpdateOptions): string {
  const blood = "#B00020"
  const bg = "#0a0a0a"
  const card = "#111111"
  const border = "#1e1e1e"
  const textMain = "#F6F6F6"
  const textMuted = "#888888"

  const name = escapeHtml(o.customerName)
  const status = escapeHtml(o.status)
  const awb = escapeHtml(o.awbCode)
  const courier = escapeHtml(o.courierName)
  const trackUrl = escapeHtml(o.trackingUrl)
  const etd = o.etd ? escapeHtml(o.etd) : null

  const headline = o.isDelivered
    ? "Your BloodThirst has arrived."
    : "Your BloodThirst is on the move."

  const subtext = o.isDelivered
    ? "The ritual is complete. Your order has been delivered."
    : "Here's the latest update on your shipment."

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

    <!-- Headline -->
    <p style="margin:0 0 8px; font-family:'Cinzel',Georgia,serif; font-size:22px; font-weight:700; color:${textMain}; text-align:center;">${headline}</p>
    <p style="margin:0 0 28px; font-size:13px; color:${textMuted}; text-align:center; line-height:1.6;">${name}, ${subtext}</p>

    <!-- Status badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:28px;">
        <span style="display:inline-block; padding:8px 20px; background:${blood}22; border:1px solid ${blood}44; border-radius:6px; font-size:12px; font-weight:600; color:${blood}; text-transform:uppercase; letter-spacing:0.1em;">${status}</span>
      </td></tr>
    </table>

    <!-- Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${border};">
      ${awb ? row("AWB Number", awb) : ""}
      ${courier ? row("Courier", courier) : ""}
      ${etd ? row("Expected Delivery", etd) : ""}
    </table>

    <!-- Track button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-top:32px;">
        <a href="${trackUrl}" style="display:inline-block; padding:14px 36px; background:${blood}; color:#ffffff; font-size:13px; font-weight:600; text-decoration:none; border-radius:8px; letter-spacing:0.05em; text-transform:uppercase;">Track Your Order</a>
      </td></tr>
    </table>

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

export function buildShippingUpdateText(o: ShippingUpdateOptions): string {
  const headline = o.isDelivered
    ? "Your BloodThirst has arrived."
    : "Your BloodThirst is on the move."

  const lines = [
    `UNHOLY CO.`,
    ``,
    headline,
    ``,
    `${o.customerName}, here's the latest update on your shipment.`,
    ``,
    `Status: ${o.status}`,
  ]

  if (o.awbCode) lines.push(`AWB Number: ${o.awbCode}`)
  if (o.courierName) lines.push(`Courier: ${o.courierName}`)
  if (o.etd) lines.push(`Expected Delivery: ${o.etd}`)

  lines.push(
    ``,
    `Track your order: ${o.trackingUrl}`,
    ``,
    `Need help? Contact us at rituals@theunholy.co`,
    ``,
    `UNHOLY CO. STAY UNHOLY.`
  )

  return lines.join("\n")
}
