import { NextRequest, NextResponse } from "next/server"
import { claimSingleUseKey, readSubscriptionToken } from "@/lib/server/order-session"
import { saveRecordToAirtable, sendWelcomeEmail } from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"

export async function GET(request: NextRequest) {
  const siteUrl = process.env.PUBLIC_SITE_URL || request.nextUrl.origin
  const redirectUrl = new URL("/", siteUrl)
  const token = request.nextUrl.searchParams.get("token")
  const payload = readSubscriptionToken(token)

  if (!payload) {
    redirectUrl.searchParams.set("subscribed", "invalid")
    return NextResponse.redirect(redirectUrl)
  }

  const kv = await getKVNamespace()
  if (!(await claimSingleUseKey("subscription", payload.email.toLowerCase(), kv))) {
    redirectUrl.searchParams.set("subscribed", "1")
    return NextResponse.redirect(redirectUrl)
  }

  try {
    await saveRecordToAirtable({
      Type: "Subscription",
      Email: payload.email,
      Name: payload.name || null,
      Source: payload.source,
      SubmittedAt: new Date().toISOString(),
    })

    await sendWelcomeEmail(payload.email)

    redirectUrl.searchParams.set("subscribed", "1")
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Subscribe confirmation error:", error)
    redirectUrl.searchParams.set("subscribed", "error")
    return NextResponse.redirect(redirectUrl)
  }
}
