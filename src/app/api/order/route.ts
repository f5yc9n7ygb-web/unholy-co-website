import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";

const RAZORPAY_ENDPOINT = "https://api.razorpay.com/v1/orders";

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
    const payload = await request.json();
    const amount = Number(payload.amount);
    const currency = (payload.currency || "INR").toUpperCase();
    const receipt = payload.receipt || `receipt_${Date.now()}`;
    const notes = payload.notes || {};

    if (!amount || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Amount (in paise) is required and must be an integer." },
        { status: 400 }
      );
    }

    const { keyId, keySecret } = getRazorpayCredentials();

    const response = await fetch(RAZORPAY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        payment_capture: 1,
        notes,
      }),
    });

    const order = await response.json();
    if (!response.ok) {
      const description = order?.error?.description || "Unable to create order";
      throw new Error(description);
    }

    return NextResponse.json({ ok: true, order }, { status: 200 });
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create an order right now." },
      { status: 500 }
    );
  }
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return { keyId, keySecret };
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
