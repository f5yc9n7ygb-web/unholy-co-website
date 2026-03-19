/**
 * Cloudflare Worker to accept form posts from the site.
 * Validates input, writes to Airtable, and triggers Mailjet.
 * Bind your secrets as environment variables.
 */
export interface Env {
  AIRTABLE_BASE_ID: string
  AIRTABLE_TABLE_NAME: string
  AIRTABLE_TOKEN: string
  MAILJET_API_KEY: string
  MAILJET_SECRET: string
  MAILJET_TEMPLATE_ID: string
  PUBLIC_SITE_URL?: string
}

const MAX_BODY_BYTES = 16 * 1024

export default {
  /**
   * Handles incoming fetch requests to the Cloudflare Worker.
   * It processes POST requests from the website's forms, validates the data,
   * writes submissions to Airtable, and sends a confirmation email via Mailjet.
   *
   * @param {Request} request - The incoming request object.
   * @param {Env} env - The environment variables containing secrets and configuration.
   * @returns {Promise<Response>} A response indicating the result of the operation.
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }
    const origin = request.headers.get('origin')
    const allowedOrigins = [env.PUBLIC_SITE_URL, new URL(request.url).origin]
      .filter(Boolean)
      .map((value) => String(value).replace(/\/$/, ''))
    if (!origin || !allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return Response.json({ ok: false, error: 'Request origin is not allowed.' }, { status: 403 })
    }
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return Response.json({ ok: false, error: 'Submission is too large.' }, { status: 413 })
    }
    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    if (contentType.includes('application/json')) {
      const text = await request.text()
      if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
        return Response.json({ ok: false, error: 'Submission is too large.' }, { status: 413 })
      }
      data = JSON.parse(text)
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text()
      if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
        return Response.json({ ok: false, error: 'Submission is too large.' }, { status: 413 })
      }
      const form = new URLSearchParams(text)
      form.forEach((v, k) => data[k] = v)
    } else {
      return new Response('Unsupported content type', { status: 400 })
    }

    if (data.company || data.website) {
      return Response.json({ ok: true })
    }

    const email = String(data.email || '').trim()
    const source = String(data.source || 'site').trim().slice(0, 40)
    const name = String(data.name || '').trim().slice(0, 80)
    const phone = String(data.phone || '').trim().slice(0, 24)
    const message = String(data.message || '').trim().slice(0, 2000)
    if (!email || !email.includes('@')) {
      return Response.json({ ok: false, error: 'Invalid email' }, { status: 400 })
    }

    // 1) Write to Airtable
    const atRes = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(env.AIRTABLE_TABLE_NAME)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records: [{ fields: {
        Email: email,
        Name: name,
        Phone: phone,
        Message: message,
        Source: source
      }}]})
    })
    if (!atRes.ok) {
      return Response.json({ ok: false, error: 'Unable to process this request.' }, { status: 500 })
    }

    // 2) Send Mailjet email (optional)
    const mjBody = {
      Messages: [{
        From: { Email: "noreply@theunholy.co", Name: "UNHOLY CO." },
        To: [{ Email: email }],
        TemplateID: Number(env.MAILJET_TEMPLATE_ID),
        TemplateLanguage: true,
        Subject: "Welcome to the circle",
        Variables: { name: name || "friend" }
      }]
    }
    const mj = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(env.MAILJET_API_KEY + ":" + env.MAILJET_SECRET) },
      body: JSON.stringify(mjBody)
    })
    if (!mj.ok) {
      // Do not fail the request for email errors
    }

    return Response.json({ ok: true })
  }
}
