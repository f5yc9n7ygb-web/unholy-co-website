import { NextRequest, NextResponse } from "next/server";
import { parseRequestBody } from "@/lib/server/parse-body";
import { saveRecordToAirtable, sendMailjetEmail } from "@/lib/server/integrations";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const CONTACT_NOTIFICATION_SUBJECT = "New contact submission — UNHOLY CO.";

/**
 * Handles POST requests for the contact form.
 * It parses form data from JSON, URL-encoded, or multipart/form-data formats,
 * validates the email, and logs the submission.
 *
 * @param {NextRequest} request - The incoming Next.js request object containing the form data.
 * @returns {Promise<NextResponse>} A JSON response indicating success or failure.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await parseRequestBody(request);
    const name = (payload.name || "").trim();
    const email = (payload.email || "").trim().toLowerCase();
    const message = (payload.message || "").trim();
    const phone = (payload.phone || "").trim();
    const source = (payload.source || "website").trim();

    if (!name || !message || !validateEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Name, valid email, and message are required." },
        { status: 400 }
      );
    }

    await saveRecordToAirtable({
      Type: "Contact",
      Name: name,
      Email: email,
      Phone: phone || null,
      Message: message,
      Source: source,
      SubmittedAt: new Date().toISOString(),
    });

    await notifyTeam({
      name,
      email,
      message,
      phone,
      source,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to submit your message right now." },
      { status: 500 }
    );
  }
}

async function notifyTeam(payload: {
  name: string;
  email: string;
  message: string;
  phone?: string;
  source?: string;
}) {
  const recipients = (process.env.CONTACT_FORWARD_EMAIL || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (!recipients.length) {
    console.warn("CONTACT_FORWARD_EMAIL is not configured; skipping notification email.");
    return;
  }

  const html = `
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    ${payload.phone ? `<p><strong>Phone:</strong> ${payload.phone}</p>` : ""}
    <p><strong>Source:</strong> ${payload.source || "website"}</p>
    <p><strong>Message:</strong></p>
    <p>${payload.message.replace(/\n/g, "<br />")}</p>
  `;

  await sendMailjetEmail({
    to: recipients,
    subject: CONTACT_NOTIFICATION_SUBJECT,
    html,
    text: `New contact submission from ${payload.name} (${payload.email})`,
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
