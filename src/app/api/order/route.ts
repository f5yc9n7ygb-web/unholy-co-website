import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const { amount, currency, receipt, notes } = data

    if (!amount || !currency) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: amount, currency' },
        { status: 400 }
      )
    }

    // TODO: Integration with Razorpay for actual order creation
    // For now, return a mock order
    const mockOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      entity: 'order',
      amount,
      amount_paid: 0,
      amount_due: amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes: notes || {},
      created_at: Math.floor(Date.now() / 1000)
    }

    console.log('Order creation request:', {
      amount,
      currency,
      receipt,
      notes
    })

    return NextResponse.json({ ok: true, order: mockOrder }, { status: 200 })
  } catch (error: any) {
    console.error('Order API error:', error)
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
