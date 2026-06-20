import {
  hasAirtableOrdersConfig,
  queryAirtableRecords,
  updateAirtableRecord,
} from "@/lib/server/integrations"
import { escapeAirtableValue } from "@/lib/server/security"
import {
  getSupabaseOrdersByEmailAndStatuses,
  updateSupabaseOrderByRazorpayOrderId,
} from "@/lib/server/supabase"
import { releaseReservation } from "@/lib/server/reservations"

/**
 * Mark the cart row for a completed payment as converted, and supersede any
 * other in-flight (pending / email_1_sent) carts from the same customer email.
 *
 * Why this exists:
 *   The checkout endpoint creates a new Orders row per call. A customer who
 *   refreshes the payment page, switches methods, or reruns checkout after a
 *   retry ends up with multiple `pending` rows for the same email — only one
 *   of which actually gets paid. Without this, the abandoned-cart cron would
 *   see the unpaid siblings and email-bomb the customer about carts they've
 *   already completed.
 *
 *   Marking those siblings `expired` here is the primary defense (runs at the
 *   moment of conversion, inside the same request). The cron has its own
 *   safety net as a backstop in case this path ever misses one.
 *
 * Field semantics:
 *   - "Status" = "converted"   — the paid cart
 *   - "Status" = "expired"     — siblings from same email we superseded
 *     (reusing the existing enum value rather than adding `superseded` because
 *     the Airtable MCP can't add enum options; `expired` is already excluded
 *     from the cron filter so semantically it's a match)
 */
export async function markCartConvertedAndSupersedeForEmail(options: {
  ordersBaseId?: string
  orderId: string
  customerEmail?: string
  /** Optional: skip the primary `mark converted` step if the caller already did it. */
  skipConvertedUpdate?: boolean
}): Promise<{ convertedRecordId: string | null; supersededCount: number }> {
  const { ordersBaseId, orderId, customerEmail, skipConvertedUpdate } = options

  const convertedAt = new Date().toISOString()

  if (!skipConvertedUpdate) {
    await updateSupabaseOrderByRazorpayOrderId(orderId, {
      status: "converted",
      converted_at: convertedAt,
    }).catch((err) => {
      console.error(`Failed to mark Supabase cart ${orderId} converted:`, err)
    })
  }

  if (customerEmail) {
    const supabaseSiblings = await getSupabaseOrdersByEmailAndStatuses(customerEmail, ["pending", "email_1_sent"])
      .catch(() => [])
    for (const sibling of supabaseSiblings) {
      if (sibling.razorpay_order_id === orderId) continue
      await updateSupabaseOrderByRazorpayOrderId(sibling.razorpay_order_id, { status: "expired" })
        .catch((err) => console.error(`Failed to expire Supabase sibling cart ${sibling.razorpay_order_id}:`, err))
      // Release the superseded sibling's held stock (P0 #5.2 leak). Gated +
      // only-once; the cart is now 'expired' so the cron won't double-release.
      await releaseReservation(sibling.razorpay_order_id)
        .catch((err) => console.error(`Failed to release sibling reservation ${sibling.razorpay_order_id}:`, err))
    }
  }

  if (!ordersBaseId || !hasAirtableOrdersConfig()) {
    return { convertedRecordId: null, supersededCount: 0 }
  }

  // 1) Find and update the Airtable mirror row for the paid order
  const records = await queryAirtableRecords({
    baseId: ordersBaseId,
    tableName: "Orders",
    filterByFormula: `{Razorpay Order ID} = "${escapeAirtableValue(orderId)}"`,
    maxRecords: 1,
  })

  const convertedRecordId = records[0]?.id ?? null

  if (convertedRecordId && !skipConvertedUpdate) {
    await updateAirtableRecord({
      baseId: ordersBaseId,
      tableName: "Orders",
      recordId: convertedRecordId,
      fields: {
        Status: "converted",
        "Converted At": new Date().toISOString().split("T")[0]!,
      },
    })
  }

  // 2) Supersede other in-flight carts from the same email
  if (!customerEmail) {
    return { convertedRecordId, supersededCount: 0 }
  }

  const emailEsc = escapeAirtableValue(customerEmail)
  const siblings = await queryAirtableRecords({
    baseId: ordersBaseId,
    tableName: "Orders",
    // lowercase-compare the email since Airtable stores whatever case the form
    // captured — same human, different casing shouldn't dodge the supersede.
    filterByFormula: `AND(
      LOWER({Customer Email}) = LOWER("${emailEsc}"),
      OR({Status} = "pending", {Status} = "email_1_sent")
    )`,
    maxRecords: 50,
  }).catch(() => [] as Awaited<ReturnType<typeof queryAirtableRecords>>)

  let supersededCount = 0
  for (const sibling of siblings) {
    if (convertedRecordId && sibling.id === convertedRecordId) continue
    try {
      await updateAirtableRecord({
        baseId: ordersBaseId,
        tableName: "Orders",
        recordId: sibling.id,
        fields: { Status: "expired" },
      })
      supersededCount++
    } catch (err) {
      // Non-fatal: the cron safety net will catch anything we miss here.
      console.error(
        `Failed to supersede sibling cart ${sibling.id} for ${customerEmail}:`,
        err
      )
    }
  }

  return { convertedRecordId, supersededCount }
}
