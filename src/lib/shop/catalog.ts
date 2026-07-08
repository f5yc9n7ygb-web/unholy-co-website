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
    id: "pack1",
    title: "Single Sin",
    qty: 1,
    price: 299,
    perCan: 299,
    blurb: "1 can. For the story, the stunt, and the first bad decision.",
  },
  {
    id: "pack3",
    title: "Trial Ritual",
    qty: 3,
    price: 699,
    perCan: 233,
    blurb: "Three cans. Enough to taste the curse properly.",
  },
  {
    id: "pack6",
    title: "The Possession",
    qty: 6,
    price: 1200,
    perCan: 200,
    blurb: "The pack most sinners choose when curiosity becomes commitment.",
    tag: "MOST POSSESSED",
  },
  {
    id: "pack12",
    title: "Cult Supply",
    qty: 12,
    price: 2200,
    perCan: 183,
    blurb: "For fridges, desks, parties, and people with taste.",
    tag: "BEST VALUE",
  },
  {
    id: "pack24",
    title: "Blood Crate",
    qty: 24,
    price: 3999,
    perCan: 167,
    blurb: "For the fully converted.",
  },
]

/**
 * One-off / stunt SKUs that must be purchasable and SERVER-PRICE-VALIDATED via
 * getPackById, but must NEVER appear in the normal pack racks (~10 components
 * iterate PACKS). Kept out of PACKS so no rack renders them; the /sin "Do Not
 * Buy" stunt selects this directly. Same security path — the order API reads the
 * price from here, never the client.
 */
export const SPECIAL_PACKS: Pack[] = [
  {
    id: "donotbuy",
    // 666 cans for ₹66,666 (~₹100/can) — a DELIBERATE loss, written off as a
    // marketing stunt. Kept at ₹66,666 (not ₹6,66,666) because Razorpay rejects
    // amounts above the account's max-order cap ("amount exceeds maximum"), so
    // the larger number isn't chargeable; this one is. The stunt has to actually
    // work if someone's unhinged enough to buy it.
    title: "Do Not Buy This",
    qty: 666,
    price: 66666,
    perCan: 100,
    blurb:
      "666 cans and a signed crate. We told you not to.",
  },
]

export function getPackById(id: string) {
  return [...PACKS, ...SPECIAL_PACKS].find((pack) => pack.id === id) || null
}

export function isSpecialPackId(id: string) {
  return SPECIAL_PACKS.some((pack) => pack.id === id)
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
