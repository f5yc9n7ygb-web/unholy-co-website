import { NextRequest, NextResponse } from 'next/server'

/**
 * Handles POST requests to create a new order.
 * This endpoint is intended for integration with a payment gateway like Razorpay.
 * It currently returns a mock order for demonstration purposes.
 *
 * @param {NextRequest} request - The incoming Next.js request object containing order details.
 * @returns {Promise<NextResponse>} A JSON response with the created order or an error message.
 */
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

/**
 * Handles GET requests to the order API endpoint.
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
