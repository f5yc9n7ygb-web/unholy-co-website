import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { getPackById } from "@/lib/shop/catalog";
import type { ShippingForm } from "@/lib/shop/types";

const RAZORPAY_ENDPOINT = "https://api.razorpay.com/v1/orders";
const RECEIPT_SUFFIX_LENGTH = 10;

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
    const packId = String(payload.packId || "").trim();
    const shipping = payload.shipping as ShippingForm | undefined;
    const pack = getPackById(packId);

    if (!pack) {
      return NextResponse.json(
        { ok: false, error: "Invalid pack selected." },
        { status: 400 }
      );
    }

    const validationError = validateShipping(shipping);
    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400 }
      );
    }

    const amount = pack.price * 100;
    const currency = "INR";
    const receipt = buildReceipt(pack.id);
    const notes = {
      packId: pack.id,
      product: pack.title,
      qty: String(pack.qty),
      customerName: shipping!.name,
      customerEmail: shipping!.email,
      customerPhone: shipping!.phone,
      shippingAddress: shipping!.address,
      shippingCity: shipping!.city,
      shippingPincode: shipping!.pincode,
      shippingState: shipping!.state,
    };

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
      console.error("Razorpay Error Payload:", order);
      const description = order?.error?.description || "Unable to create order";
      throw new Error(description);
    }

    return NextResponse.json({ ok: true, order }, { status: 200 });
  } catch (error: any) {
    console.error("Order API error:", error?.message || error);
    return NextResponse.json(
      { ok: false, error: "Unable to create an order right now.", details: error?.message },
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

function buildReceipt(packId: string) {
  return `${packId}_${Date.now().toString().slice(-RECEIPT_SUFFIX_LENGTH)}`;
}

function validateShipping(shipping?: ShippingForm) {
  if (!shipping) return "Shipping details are required.";
  if (!shipping.name?.trim()) return "Name is required.";
  if (!shipping.email?.trim()) return "Email is required.";
  if (!shipping.phone?.trim()) return "Phone is required.";
  if (!shipping.address?.trim()) return "Address is required.";
  if (!shipping.city?.trim()) return "City is required.";
  if (!shipping.pincode?.trim()) return "Pincode is required.";
  if (!shipping.state?.trim()) return "State is required.";
  return null;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
