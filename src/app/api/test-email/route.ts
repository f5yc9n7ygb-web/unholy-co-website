import { NextRequest, NextResponse } from "next/server";
import { sendAbandonedCartEmail1, sendAbandonedCartEmail2 } from "@/lib/server/integrations";
import { buildAbandonedCartEmail1Html, buildAbandonedCartEmail2Html } from "@/lib/email/abandoned-cart-templates";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const preview = request.nextUrl.searchParams.get("preview");
  
  const opts = {
      customerEmail: email || "sinner@theunholy.co",
      customerName: "Test Sinner",
      packTitle: "BloodThirst",
      packQty: 2,
      packPrice: 1332,
  };

  if (preview === "1") {
    return new NextResponse(buildAbandonedCartEmail1Html(opts), { headers: { "Content-Type": "text/html" } });
  } else if (preview === "2") {
    return new NextResponse(buildAbandonedCartEmail2Html(opts), { headers: { "Content-Type": "text/html" } });
  }

  if (!email) {
    return NextResponse.json({ 
      message: "How to test abandoned cart emails:",
      previewEmail1InBrowser: "/api/test-email?preview=1",
      previewEmail2InBrowser: "/api/test-email?preview=2",
      sendEmailsToYourInbox: "/api/test-email?email=YOUR_EMAIL_HERE"
    });
  }

  try {
    await sendAbandonedCartEmail1(opts);
    await sendAbandonedCartEmail2(opts);

    return NextResponse.json({ success: true, message: `Successfully sent test abandoned cart emails 1 & 2 to ${email}` });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
