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

  // Persist BEFORE consuming the single-use key. If both stores fail we leave
  // the confirmation link usable so the customer can retry from the same email.
  // Supabase upsert + Airtable insert are both safe under double-click — the
  // subsequent claimSingleUseKey is what gates the welcome email.
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

  // Single-use guard: only the first confirmation through this code path sends
  // the welcome email. A double-click or token replay sees subscribed=1 but no
  // duplicate email. Persistence already happened above (idempotent), so we're
  // not racing the storage write.
  const kv = await getKVNamespace()
  const firstConfirmation = await claimSingleUseKey("subscription", payload.email.toLowerCase(), kv)

  if (firstConfirmation) {
    try {
      await sendWelcomeEmail(payload.email)
    } catch (error) {
      console.error("Welcome email failed:", error)
    }
  }

  redirectUrl.searchParams.set("subscribed", "1")
  return NextResponse.redirect(redirectUrl)
}
