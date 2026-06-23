import type { Metadata } from "next"
import { PACKS, getPackById } from "@/lib/shop/catalog"
import { SIN_ENTRY_PACK_ID } from "@/content/sin"
import { SinClient } from "./SinClient"

/**
 * /sin — "THE BLACK ROOM" BloodThirst landing page for cold Instagram traffic.
 *
 * A premium spotlit-specimen experience that stays light: ISR (no
 * force-dynamic), no three.js / WebGL / GSAP / Lenis. Reuses the real ritual
 * checkout (useRitualCheckout) and the existing Razorpay + Meta Pixel
 * plumbing — payments are NOT reinvented here.
 *
 * Kept out of the index (noindex) like /buy and /bloodthirst-shop.
 */
export const revalidate = 60

const TITLE = "BloodThirst — Drink in Cold Blood"
const DESCRIPTION =
  "500ml Himalayan still mineral water in a matte-black can. Batch 001, first run. Available in 6, 12, and 24-can packs — FSSAI licensed, Razorpay secure, free India delivery."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/sin" },
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/sin",
    images: [{ url: "/og-hero.png", width: 1200, height: 630, alt: "BloodThirst — UNHOLY CO." }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-hero.png"],
  },
}

export default function SinPage() {
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""

  // /sin currently sells only shipping-ready packs. Default is derived from the
  // same content id the hero uses, so the hero price and checkout default stay
  // aligned.
  const defaultPackId = (getPackById(SIN_ENTRY_PACK_ID) || PACKS[0]).id

  return <SinClient razorpayKey={razorpayKey} defaultPackId={defaultPackId} />
}
