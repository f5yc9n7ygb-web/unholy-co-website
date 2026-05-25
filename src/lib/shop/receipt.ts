import { GST_RATE } from "@/lib/shop/catalog"

export type ReceiptPricing = {
  currency: "INR"
  /** Catalog total before a checkout promo. GST-inclusive. */
  grossTotal: number
  /** GST-inclusive promo discount. */
  discountAmount: number
  /** Taxable value after discount. */
  subtotal: number
  /** GST included in `total` after discount. */
  gstAmount: number
  /** Amount Razorpay must charge after discount. GST-inclusive. */
  total: number
}

export function moneyToPaise(value: number): number {
  return Math.round(normalizeMoney(value) * 100)
}

export function createReceiptPricing(grossTotal: number, discountAmount = 0): ReceiptPricing {
  const grossPaise = moneyToPaise(grossTotal)
  const discountPaise = Math.min(moneyToPaise(discountAmount), grossPaise)
  const totalPaise = grossPaise - discountPaise
  const subtotalPaise = Math.round(totalPaise / (1 + GST_RATE))

  return {
    currency: "INR",
    grossTotal: grossPaise / 100,
    discountAmount: discountPaise / 100,
    subtotal: subtotalPaise / 100,
    gstAmount: (totalPaise - subtotalPaise) / 100,
    total: totalPaise / 100,
  }
}

/**
 * Rehydrate pricing when persisted payment rows only carry the paid total and
 * discount. Their gross total is the exact paid value plus that discount.
 */
export function createPaidReceiptPricing(total: number, discountAmount = 0): ReceiptPricing {
  const totalPaise = moneyToPaise(total)
  const discountPaise = moneyToPaise(discountAmount)
  return createReceiptPricing((totalPaise + discountPaise) / 100, discountPaise / 100)
}

export function readReceiptPricing(value: unknown): ReceiptPricing | null {
  if (!value || typeof value !== "object") return null

  const candidate = value as Partial<Record<keyof ReceiptPricing, unknown>>
  if (candidate.currency !== "INR") return null

  const grossTotal = Number(candidate.grossTotal)
  const discountAmount = Number(candidate.discountAmount)
  const total = Number(candidate.total)
  if (![grossTotal, discountAmount, total].every(Number.isFinite)) return null

  const pricing = createReceiptPricing(grossTotal, discountAmount)
  return moneyToPaise(pricing.total) === moneyToPaise(total) ? pricing : null
}

function normalizeMoney(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}
