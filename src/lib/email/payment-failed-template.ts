export type PaymentFailedEmailOptions = {
  customerName: string
  packTitle: string
  shopUrl?: string
}

const blood = "#B00020"
const bg = "#0a0a0a"
const card = "#111111"
const border = "#1e1e1e"
const textMain = "#F6F6F6"
const textMuted = "#888888"
const textDim = "#555555"

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function buildPaymentFailedHtml(o: PaymentFailedEmailOptions): string {
  const firstName = escapeHtml(o.customerName.split(" ")[0] || "Sinner")
  const shopUrl = o.shopUrl || "https://theunholy.co/shop"
  const packTitle = escapeHtml(o.packTitle)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>UNHOLY CO.</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
    :root { color-scheme: light; }
  </style>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:Arial,Helvetica,sans-serif;color-scheme:light;">

  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${bg};">
    Your payment didn't go through — try again.
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
            <td style="padding:0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${card};border:1px solid ${border};border-radius:4px;">
                <tr>
                  <td style="padding:40px 32px;">

                    <div style="font-family:'Cinzel',Georgia,serif; font-size:22px; font-weight:700; color:${textMain}; letter-spacing:0.05em; margin-bottom:20px; line-height:1.3;">
                      The ritual<br>was interrupted.
                    </div>

                    <div style="height:1px; background:${blood}; opacity:0.3; margin-bottom:24px;"></div>

                    <p style="margin:0 0 16px; font-size:14px; color:${textMuted}; line-height:1.7;">
                      ${firstName},
                    </p>
                    <p style="margin:0 0 20px; font-size:14px; color:${textMuted}; line-height:1.7;">
                      Your payment for <strong style="color:${textMain};">${packTitle}</strong> didn't go through. Nothing was charged.
                    </p>
                    <p style="margin:0 0 32px; font-size:14px; color:${textMuted}; line-height:1.7;">
                      This can happen due to a temporary issue with your bank or card. Your cart is still waiting — retry when you're ready.
                    </p>

                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:${blood}; border-radius:2px;">
                          <a href="${shopUrl}" style="display:inline-block; padding:14px 28px; font-family:'Cinzel',Georgia,serif; font-size:12px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.15em; text-transform:uppercase;">
                            Retry Your Order
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 40px; text-align:center;">
              <div style="height:1px; background:${border}; margin-bottom:24px;"></div>
              <div style="font-size:11px; color:${textDim}; line-height:1.7;">
                Questions? <a href="mailto:rituals@theunholy.co" style="color:${textMuted}; text-decoration:none;">rituals@theunholy.co</a><br><br>
                <span style="color:${textDim};">UNHOLY CO. STAY UNHOLY.<br>
                &copy; ${new Date().getFullYear()} UNHOLY CO. All rights reserved.</span>
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

export function buildPaymentFailedText(o: PaymentFailedEmailOptions): string {
  const firstName = o.customerName.split(" ")[0] || "Sinner"
  const shopUrl = o.shopUrl || "https://theunholy.co/shop"
  return `UNHOLY CO.

${firstName},

Your payment for ${o.packTitle} didn't go through. Nothing was charged.

This can happen due to a temporary issue with your bank or card. Your cart is still waiting — retry when you're ready.

Retry your order: ${shopUrl}

---
Questions? rituals@theunholy.co
UNHOLY CO. STAY UNHOLY.`
}
