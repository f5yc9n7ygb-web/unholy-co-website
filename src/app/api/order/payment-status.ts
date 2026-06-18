export type PaymentFulfilmentDecision = "fulfil" | "pending" | "reject"

/**
 * Captured-only fulfilment gate.
 *
 * Orders are created with auto-capture (`payment_capture: 1`), so `authorized`
 * is a transient pre-capture state — it may still fail capture or be
 * auto-refunded. We must NOT run side effects (persist order, decrement stock,
 * consume promo, ship, email, fire analytics) until the payment is `captured`.
 *
 * - `captured`   → fulfil now.
 * - `authorized` → pending: do nothing here; the `payment.captured` webhook is
 *                  the single fulfilment path. (Verify may still return a
 *                  receipt so the customer reaches /thanks.)
 * - anything else (failed/created/refunded/…) → reject.
 */
export function decidePaymentFulfilment(status: string): PaymentFulfilmentDecision {
  if (status === "captured") return "fulfil"
  if (status === "authorized") return "pending"
  return "reject"
}
