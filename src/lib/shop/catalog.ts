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
