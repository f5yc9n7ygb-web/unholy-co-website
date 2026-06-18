import type { KVNamespace } from "@/lib/server/kv"
import {
  claimPaymentProcessing,
  completePaymentProcessing,
  failPaymentProcessing,
} from "@/lib/server/supabase"
import { claimProcessedPayment, releaseProcessedPayment } from "@/lib/server/order-session"

export type PaymentClaimResult = {
  granted: boolean
  state: "processing" | "completed" | "failed_retryable" | "unknown"
  source: "supabase" | "kv"
}

/**
 * Claim a payment for fulfilment.
 *
 * The durable Postgres claim is primary — it's a real atomic compare-and-set,
 * so a browser verify and a Razorpay webhook racing on the same payment_id can
 * never both win (audit P0 #3). When Supabase is unconfigured/unreachable we
 * fall back to the legacy KV claim so dev and degraded mode still have *some*
 * dedup. The existing Supabase/Airtable "payment already exists" checks in the
 * routes remain as defense-in-depth on top of this.
 */
export async function claimPaymentForProcessing(
  paymentId: string,
  kv?: KVNamespace | null,
): Promise<PaymentClaimResult> {
  const durable = await claimPaymentProcessing(paymentId).catch(() => null)
  if (durable) {
    return { granted: durable.granted, state: durable.state, source: "supabase" }
  }
  const granted = await claimProcessedPayment(paymentId, kv)
  return { granted, state: granted ? "processing" : "completed", source: "kv" }
}

/** Terminal success — mark the claim completed once durable fulfilment lands. */
export async function completePaymentClaim(paymentId: string): Promise<void> {
  await completePaymentProcessing(paymentId).catch(() => {})
}

/**
 * Fulfilment failed before durable persistence — transition the claim to
 * failed_retryable and drop the KV marker so a later webhook retry can
 * re-claim and reprocess (audit P0 #4). Never blocks future retries.
 */
export async function failPaymentClaim(
  paymentId: string,
  kv?: KVNamespace | null,
  lastError?: string,
): Promise<void> {
  await failPaymentProcessing(paymentId, lastError).catch(() => {})
  await releaseProcessedPayment(paymentId, kv).catch(() => {})
}
