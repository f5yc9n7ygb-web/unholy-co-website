import { NextRequest, NextResponse } from 'next/server'

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

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
