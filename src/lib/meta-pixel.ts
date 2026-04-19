/**
 * Meta Pixel (Facebook Pixel) client-side helper.
 *
 * Usage:
 *   import { trackPixel } from "@/lib/meta-pixel"
 *   trackPixel("AddToCart", { value: 1200, currency: "INR", content_ids: ["pack6"] })
 *
 * Silently no-ops when the pixel script hasn't loaded (e.g. env var not set,
 * ad blocker active, SSR). Never throws.
 */

type StandardEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Contact"
  | "Search"

type PixelParams = {
  value?: number
  currency?: string
  content_ids?: string[]
  content_name?: string
  content_type?: "product" | "product_group"
  content_category?: string
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  num_items?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: ((...args: any[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean }
    _fbq?: unknown
  }
}

/**
 * Fire a standard Meta Pixel event. Safe to call from any client component.
 * `eventID` is optional — pass it when also sending the same event via the
 * Conversions API so Meta can deduplicate.
 */
export function trackPixel(event: StandardEvent, params?: PixelParams, eventID?: string): void {
  if (typeof window === "undefined") return
  const fbq = window.fbq
  if (typeof fbq !== "function") return
  try {
    if (eventID) {
      fbq("track", event, params ?? {}, { eventID })
    } else {
      fbq("track", event, params ?? {})
    }
  } catch {
    /* swallow — tracking must never break UX */
  }
}

/** Fire a custom (non-standard) event. */
export function trackPixelCustom(event: string, params?: PixelParams, eventID?: string): void {
  if (typeof window === "undefined") return
  const fbq = window.fbq
  if (typeof fbq !== "function") return
  try {
    if (eventID) {
      fbq("trackCustom", event, params ?? {}, { eventID })
    } else {
      fbq("trackCustom", event, params ?? {})
    }
  } catch {
    /* no-op */
  }
}
