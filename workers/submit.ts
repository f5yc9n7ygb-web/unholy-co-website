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
}

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
    const contentType = request.headers.get('content-type') || ''
    let data: any = {}
    if (contentType.includes('application/json')) {
      data = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData()
      form.forEach((v, k) => data[k] = v)
    } else {
      return new Response('Unsupported content type', { status: 400 })
    }

    const email = String(data.email || '').trim()
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
        Name: data.name || '',
        Phone: data.phone || '',
        Message: data.message || '',
        Source: data.source || 'site'
      }}]})
    })
    if (!atRes.ok) {
      const t = await atRes.text()
      return Response.json({ ok: false, error: 'Airtable error', detail: t }, { status: 500 })
    }

    // 2) Send Mailjet email (optional)
    const mjBody = {
      Messages: [{
        From: { Email: "noreply@theunholy.co", Name: "UNHOLY CO." },
        To: [{ Email: email }],
        TemplateID: Number(env.MAILJET_TEMPLATE_ID),
        TemplateLanguage: true,
        Subject: "Welcome to the circle",
        Variables: { name: data.name || "friend" }
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
