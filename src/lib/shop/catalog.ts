export type Pack = {
  id: string
  title: string
  qty: number
  price: number
  perCan: number
  blurb: string
  tag?: string
}

export const PACKS: Pack[] = [
  {
    id: "pack6",
    title: "Starter Ritual",
    qty: 6,
    price: 1200,
    perCan: 200,
    blurb: "6 cans of cold-forged hydration. Perfect first taste.",
  },
  {
    id: "pack12",
    title: "Weekend Coven",
    qty: 12,
    price: 2220,
    perCan: 185,
    blurb: "12 cans for the weekend warriors and night crawlers.",
    tag: "MOST POPULAR",
  },
  {
    id: "pack24",
    title: "True Believer",
    qty: 24,
    price: 4056,
    perCan: 169,
    blurb: "24 cans. Full commitment. Maximum savings.",
    tag: "BEST VALUE",
  },
]

export function getPackById(id: string) {
  return PACKS.find((pack) => pack.id === id) || null
}

/**
 * GST rate for natural mineral water (HSN 2201).
 * Prices in the catalog are GST-inclusive.
 */
export const GST_RATE = 0.05

/** Extract GST amount from a GST-inclusive price */
export function getGstAmount(inclusivePrice: number): number {
  return Math.round(((inclusivePrice * GST_RATE) / (1 + GST_RATE)) * 100) / 100
}

/** Get base price (before GST) from a GST-inclusive price */
export function getBasePrice(inclusivePrice: number): number {
  return Math.round((inclusivePrice - getGstAmount(inclusivePrice)) * 100) / 100
}
