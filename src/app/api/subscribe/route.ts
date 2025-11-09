import { NextRequest, NextResponse } from 'next/server'

/**
 * Handles POST requests for newsletter subscriptions.
 * It parses form data, validates the email address, and logs the subscription request.
 *
 * @param {NextRequest} request - The incoming Next.js request object containing the subscription data.
 * @returns {Promise<NextResponse>} A JSON response indicating success or failure.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let data: Record<string, any> = {}

    if (contentType.includes('application/json')) {
      data = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      formData.forEach((value, key) => {
        data[key] = value.toString()
      })
    } else {
      return NextResponse.json(
        { ok: false, error: 'Unsupported content type' },
        { status: 400 }
      )
    }

    const email = String(data.email || '').trim()
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email' },
        { status: 400 }
      )
    }

    // TODO: Integration with Airtable and Mailjet for newsletter subscriptions
    // For now, just accept the submission
    console.log('Subscribe form submission:', {
      email,
      source: data.source
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    console.error('Subscribe API error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handles GET requests to the subscribe API endpoint.
 * This method is not allowed for this endpoint and will return a 405 error.
 *
 * @returns {Promise<NextResponse>} A JSON response indicating the method is not allowed.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
