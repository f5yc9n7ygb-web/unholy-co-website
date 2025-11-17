import { NextRequest, NextResponse } from "next/server";
import { parseRequestBody } from "@/lib/server/parse-body";
import { saveRecordToAirtable, sendWelcomeEmail } from "@/lib/server/integrations";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Handles POST requests for newsletter subscriptions.
 * It parses form data, validates the email address, and logs the subscription request.
 *
 * @param {NextRequest} request - The incoming Next.js request object containing the subscription data.
 * @returns {Promise<NextResponse>} A JSON response indicating success or failure.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await parseRequestBody(request);
    const email = (payload.email || "").trim().toLowerCase();
    const name = (payload.name || "").trim();
    const source = (payload.source || "website").trim();

    if (!validateEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
    }

    await saveRecordToAirtable({
      Type: "Subscription",
      Email: email,
      Name: name || null,
      Source: source,
      SubmittedAt: new Date().toISOString(),
    });

    await sendWelcomeEmail(email);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Subscribe API error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to add you to the list right now." },
      { status: 500 }
    );
  }
}

/**
 * Handles GET requests to the subscribe API endpoint.
 * This method is not allowed for this endpoint and will return a 405 error.
 *
 * @returns {Promise<NextResponse>} A JSON response indicating the method is not allowed.
 */
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
