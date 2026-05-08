import { NextRequest, NextResponse } from "next/server"
import { claimSingleUseKey, readSubscriptionToken } from "@/lib/server/order-session"
import { saveRecordToAirtable, sendWelcomeEmail } from "@/lib/server/integrations"
import { getKVNamespace } from "@/lib/server/kv"
import { upsertSupabaseSubscription } from "@/lib/server/supabase"

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

  let supabasePersisted = false
  try {
    const inserted = await upsertSupabaseSubscription({
      email: payload.email,
      name: payload.name || null,
      source: payload.source || null,
      status: "confirmed",
      source_payload: { source: payload.source || "website" },
      confirmed_at: new Date().toISOString(),
    })
    supabasePersisted = Boolean(inserted)
  } catch (err) {
    console.error("Supabase subscription persist failed, trying Airtable mirror:", err)
  }

  let airtablePersisted = false
  try {
    await saveRecordToAirtable({
      Type: "Subscription",
      Email: payload.email,
      Name: payload.name || null,
      Source: payload.source,
      SubmittedAt: new Date().toISOString(),
    })
    airtablePersisted = true
  } catch (err) {
    console.error("Airtable subscription mirror failed:", err)
  }

  if (!supabasePersisted && !airtablePersisted) {
    console.error("No backend store accepted the subscription.")
    redirectUrl.searchParams.set("subscribed", "error")
    return NextResponse.redirect(redirectUrl)
  }

  try {
    await sendWelcomeEmail(payload.email)
  } catch (error) {
    console.error("Welcome email failed:", error)
  }

  redirectUrl.searchParams.set("subscribed", "1")
  return NextResponse.redirect(redirectUrl)
}
