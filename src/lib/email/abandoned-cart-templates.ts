export type AbandonedCartEmailOptions = {
  customerName: string
  packTitle: string
  packQty: number
  packPrice: number
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

function emailShell(preheader: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>UNHOLY CO.</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
    :root { color-scheme: light; }
  </style>
</head>
<body style="margin:0;padding:0;background:${bg};font-family:Arial,Helvetica,sans-serif;color-scheme:light;">

  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${bg};">
    ${preheader}
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

          ${content}

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

/* ─── Email 1: "The Unfinished Ritual" — sent 30 min after abandonment ─── */

export function buildAbandonedCartEmail1Html(o: AbandonedCartEmailOptions): string {
  const firstName = escapeHtml(o.customerName.split(" ")[0] || "Sinner")
  const shopUrl = o.shopUrl || "https://theunholy.co/shop"
  const priceFormatted = `₹${o.packPrice.toLocaleString("en-IN")}`

  const content = `
          <tr>
            <td style="padding:40px 32px; background:${card}; border-radius:8px 8px 0 0; text-align:center; border-bottom:2px solid ${blood};">
              <div style="font-family:'Cinzel',Georgia,serif; font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:${blood}; margin-bottom:16px;">Ritual Interrupted</div>
              <h1 style="margin:0; font-family:'Cinzel',Georgia,serif; font-size:30px; font-weight:700; color:${textMain}; line-height:1.2;">Your ritual was<br>left unfinished.</h1>
              <p style="margin:20px 0 0; font-size:14px; color:${textMuted}; line-height:1.7;">
                ${firstName}, you were so close.<br>
                The darkness was ready to embrace you — but you turned away.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px; background:${card}; border-top:1px solid ${border};">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.35em; color:${textDim}; margin-bottom:16px;">What You Left Behind</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMuted}; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; width:40%;">Product</td>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMain}; font-size:13px; text-align:right;">${escapeHtml(o.packTitle)}</td>
                </tr>
                <tr>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMuted}; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; width:40%;">Quantity</td>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMain}; font-size:13px; text-align:right;">${o.packQty} cans</td>
                </tr>
                <tr>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMuted}; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; width:40%;">Total</td>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMain}; font-size:13px; text-align:right; font-weight:700;">${priceFormatted}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px; background:${card}; border-top:1px solid ${border}; border-radius:0 0 8px 8px; text-align:center;">
              <p style="margin:0 0 8px; font-size:13px; color:${textMuted}; line-height:1.6;">
                Some things aren't meant to be abandoned.<br>
                <span style="color:${blood};">This is one of them.</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px; text-align:center;">
              <a href="${shopUrl}" style="display:inline-block; background:${blood}; color:#fff; text-decoration:none; font-family:'Cinzel',Georgia,serif; font-size:12px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; padding:16px 40px; border-radius:4px;">
                Complete Your Ritual
              </a>
              <p style="margin:16px 0 0; font-size:12px; color:${textDim};">
                Free shipping · All India · Secure checkout
              </p>
            </td>
          </tr>`

  return emailShell(
    `${firstName}, your BloodThirst is waiting. You left something behind — come back and finish what you started.`,
    content
  )
}

export function buildAbandonedCartEmail1Text(o: AbandonedCartEmailOptions): string {
  const firstName = o.customerName.split(" ")[0] || "Sinner"
  const shopUrl = o.shopUrl || "https://theunholy.co/shop"

  return `YOUR RITUAL WAS LEFT UNFINISHED — UNHOLY CO.

${firstName}, you were so close.
The darkness was ready to embrace you — but you turned away.

WHAT YOU LEFT BEHIND
--------------------
Product:  ${o.packTitle}
Quantity: ${o.packQty} cans
Total:    ₹${o.packPrice.toLocaleString("en-IN")}

Some things aren't meant to be abandoned. This is one of them.

Complete your ritual: ${shopUrl}

Free shipping · All India · Secure checkout

Questions? rituals@theunholy.co

UNHOLY CO. STAY UNHOLY.
`
}

/* ─── Email 2: "The BloodThirst Doesn't Forget" — sent 24h after email 1 ─── */

export function buildAbandonedCartEmail2Html(o: AbandonedCartEmailOptions): string {
  const firstName = escapeHtml(o.customerName.split(" ")[0] || "Sinner")
  const shopUrl = o.shopUrl || "https://theunholy.co/shop"
  const priceFormatted = `₹${o.packPrice.toLocaleString("en-IN")}`

  const content = `
          <tr>
            <td style="padding:40px 32px; background:${card}; border-radius:8px 8px 0 0; text-align:center; border-bottom:2px solid ${blood};">
              <div style="font-family:'Cinzel',Georgia,serif; font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:${blood}; margin-bottom:16px;">Final Summons</div>
              <h1 style="margin:0; font-family:'Cinzel',Georgia,serif; font-size:28px; font-weight:700; color:${textMain}; line-height:1.2;">The BloodThirst<br>doesn't forget.</h1>
              <p style="margin:20px 0 0; font-size:14px; color:${textMuted}; line-height:1.7;">
                ${firstName}, we don't chase.<br>
                But we're not going to pretend this didn't happen.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px; background:${card}; border-top:1px solid ${border};">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.35em; color:${textDim}; margin-bottom:16px;">Still Waiting For You</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMuted}; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; width:40%;">Product</td>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMain}; font-size:13px; text-align:right;">${escapeHtml(o.packTitle)}</td>
                </tr>
                <tr>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMuted}; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; width:40%;">Quantity</td>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; color:${textMain}; font-size:13px; text-align:right;">${o.packQty} cans</td>
                </tr>
                <tr>
                  <td style="padding:14px 0; color:${textMuted}; font-size:11px; text-transform:uppercase; letter-spacing:0.12em; width:40%;">Total</td>
                  <td style="padding:14px 0; color:${textMain}; font-size:13px; text-align:right; font-weight:700;">${priceFormatted}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px; background:${card}; border-top:1px solid ${border}; border-radius:0 0 8px 8px;">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.35em; color:${textDim}; margin-bottom:16px;">What You're Missing</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; vertical-align:top; width:40px;">
                    <span style="font-family:'Cinzel',Georgia,serif; font-size:12px; font-weight:700; color:${blood}; opacity:0.7;">01</span>
                  </td>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; padding-left:16px;">
                    <div style="font-size:13px; font-weight:600; color:${textMain};">Born at 11,000 ft.</div>
                    <div style="font-size:12px; color:${textMuted}; margin-top:3px;">Sourced from Himalayan darkness. Your tap water could never.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; vertical-align:top; width:40px;">
                    <span style="font-family:'Cinzel',Georgia,serif; font-size:12px; font-weight:700; color:${blood}; opacity:0.7;">02</span>
                  </td>
                  <td style="padding:14px 0; border-bottom:1px solid ${border}; padding-left:16px;">
                    <div style="font-size:13px; font-weight:600; color:${textMain};">Sinfully Clean.</div>
                    <div style="font-size:12px; color:${textMuted}; margin-top:3px;">Zero sugar. Zero plastic. All aluminium. The devil's in the details — and we nailed every one.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0; vertical-align:top; width:40px;">
                    <span style="font-family:'Cinzel',Georgia,serif; font-size:12px; font-weight:700; color:${blood}; opacity:0.7;">03</span>
                  </td>
                  <td style="padding:14px 0; padding-left:16px;">
                    <div style="font-size:13px; font-weight:600; color:${textMain};">Ships Free. No Strings. No Soul Required.</div>
                    <div style="font-size:12px; color:${textMuted}; margin-top:3px;">Free shipping. All India. Shows up at your door uninvited — just like good trouble should.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px; text-align:center;">
              <p style="margin:0 0 20px; font-family:'Cinzel',Georgia,serif; font-size:14px; color:${textMain}; line-height:1.5;">
                This is the last time we'll ask.
              </p>
              <a href="${shopUrl}" style="display:inline-block; background:${blood}; color:#fff; text-decoration:none; font-family:'Cinzel',Georgia,serif; font-size:12px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; padding:16px 40px; border-radius:4px;">
                Finish What You Started
              </a>
              <p style="margin:16px 0 0; font-size:12px; color:${textDim};">
                Free shipping · All India · Secure checkout
              </p>
            </td>
          </tr>`

  return emailShell(
    `${firstName}, the BloodThirst doesn't forget. Your ${o.packTitle} is still waiting. This is the last time we'll ask.`,
    content
  )
}

export function buildAbandonedCartEmail2Text(o: AbandonedCartEmailOptions): string {
  const firstName = o.customerName.split(" ")[0] || "Sinner"
  const shopUrl = o.shopUrl || "https://theunholy.co/shop"

  return `THE BLOODTHIRST DOESN'T FORGET — UNHOLY CO.

${firstName}, we don't chase.
But we're not going to pretend this didn't happen.

STILL WAITING FOR YOU
---------------------
Product:  ${o.packTitle}
Quantity: ${o.packQty} cans
Total:    ₹${o.packPrice.toLocaleString("en-IN")}

WHAT YOU'RE MISSING
-------------------
01 — Born at 11,000 ft. Sourced from Himalayan darkness. Your tap water could never.
02 — Sinfully Clean. Zero sugar. Zero plastic. The devil's in the details.
03 — Ships Free. No Strings. No Soul Required. Shows up at your door uninvited — just like good trouble should.

This is the last time we'll ask.

Finish what you started: ${shopUrl}

Questions? rituals@theunholy.co

UNHOLY CO. STAY UNHOLY.
`
}
