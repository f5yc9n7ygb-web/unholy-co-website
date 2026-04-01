import { NextRequest, NextResponse } from "next/server";
import { sendAbandonedCartEmail1, sendAbandonedCartEmail2 } from "@/lib/server/integrations";
import { buildAbandonedCartEmail1Html, buildAbandonedCartEmail2Html } from "@/lib/email/abandoned-cart-templates";

// Preview renders (no email sent) are allowed without auth.
// Actual email sending requires CRON_SECRET bearer token.

export async function GET(request: NextRequest) {
  const preview = request.nextUrl.searchParams.get("preview");

  const opts = {
      customerEmail: "sinner@theunholy.co",
      customerName: "Test Sinner",
      packTitle: "BloodThirst",
      packQty: 2,
      packPrice: 1332,
  };

  if (preview === "1") {
    return new NextResponse(buildAbandonedCartEmail1Html(opts), { headers: { "Content-Type": "text/html" } });
  }
  if (preview === "2") {
    return new NextResponse(buildAbandonedCartEmail2Html(opts), { headers: { "Content-Type": "text/html" } });
  }

  // All non-preview routes require CRON_SECRET authorization
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({
      message: "How to test abandoned cart emails:",
      previewEmail1InBrowser: "/api/test-email?preview=1",
      previewEmail2InBrowser: "/api/test-email?preview=2",
      sendEmailsToYourInbox: "/api/test-email?email=YOUR_EMAIL_HERE (requires Authorization: Bearer <CRON_SECRET>)"
    });
  }

  try {
    const sendOpts = { ...opts, customerEmail: email };
    await sendAbandonedCartEmail1(sendOpts);
    await sendAbandonedCartEmail2(sendOpts);
    return NextResponse.json({ success: true, message: `Sent test emails to ${email}` });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
