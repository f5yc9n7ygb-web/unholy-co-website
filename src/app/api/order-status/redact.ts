/**
 * Track mode (order-ID-only lookup) must never expose customer PII.
 *
 * Returning email/phone from an ID-only lookup let an attacker harvest a
 * customer's contact details from a guessed/known order ID and then use that
 * email to unlock the invoice endpoint (full PII). History mode is identity-
 * verified (email + a matching order ID) so the requester's own contact info
 * may remain — they already proved ownership of that email.
 */
export type OrderContactView = {
  customerEmail: string
  customerPhone?: string
}

export function redactOrderContact<T extends OrderContactView>(order: T): T {
  return { ...order, customerEmail: "", customerPhone: "" }
}
