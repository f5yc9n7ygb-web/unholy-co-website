import { CHECKOUT_ADD_ON_CONFIG, isCheckoutAddOnId } from "./addon-config"

/**
 * Shared add-on helpers used by the checkout payment paths (verify + webhook).
 *
 * Add-ons (Cursed Note, Unholy Ledger) are priced server-side and carried
 * through the signed order session + abandoned-cart source_payload so both the
 * synchronous verify path and the async Razorpay webhook can persist and
 * itemize them, regardless of which one wins the race to fulfill.
 */
export type CheckoutAddOnId = "cursed_note" | "unholy_ledger"

export type CheckoutAddOnRecord = {
  id: CheckoutAddOnId
  title: string
  price: number
  data?: Record<string, unknown>
}

export function readCheckoutAddOns(value: unknown): CheckoutAddOnRecord[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const candidate = item as Record<string, unknown>
    const rawId = String(candidate.id || "")
    if (!isCheckoutAddOnId(rawId)) return []
    const config = CHECKOUT_ADD_ON_CONFIG[rawId]

    const data = candidate.data && typeof candidate.data === "object"
      ? candidate.data as Record<string, unknown>
      : undefined

    return [{
      id: rawId,
      title: config.title,
      price: config.price,
      data,
    }]
  })
}

/** Human-readable one-line summary of an add-on's details, for emails/records. */
export function summarizeAddOn(addOn: { id: string; data?: Record<string, unknown> }): string {
  const data = addOn.data || {}
  const pick = (key: string) => String(data[key] ?? "").trim().slice(0, 80)
  if (addOn.id === "cursed_note") {
    return [pick("recipientName"), pick("tone")].filter(Boolean).join(" · ")
  }
  if (addOn.id === "unholy_ledger") {
    return [pick("displayName"), pick("city")].filter(Boolean).join(" · ")
  }
  return ""
}
