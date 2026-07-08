import type { Metadata } from "next"
import { Anton } from "next/font/google"
import { PACKS, getPackById } from "@/lib/shop/catalog"
import { SIN_ENTRY_PACK_ID } from "@/content/sin"
import { SinClient } from "./SinClient"

/**
 * /sin — "THE RED MASS" BloodThirst landing page for cold Instagram traffic.
 *
 * Hype-drop brutalism: full-bleed black/blood slabs, Anton poster type, hard
 * offset shadows, sticker-stamps, tickers. Stays light — ISR (no
 * force-dynamic), no route-level three.js / WebGL / Lenis. Reuses the real
 * ritual checkout (useRitualCheckout) and the existing Razorpay + Meta Pixel
 * plumbing — payments are NOT reinvented here.
 *
 * Kept out of the index (noindex) like /buy and /bloodthirst-shop.
 */
export const revalidate = 60

/** RED MASS poster face — loaded route-locally so only /sin pays for it. */
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
})

const TITLE = "BloodThirst — Drink Like You Mean It"
const DESCRIPTION =
  "500ml Himalayan still mineral water in a matte-black can. Batch 001, first pressing. 6, 12 and 24-can drops — FSSAI licensed, Razorpay secure, free India delivery."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/sin" },
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/sin",
    // RED MASS poster card — links get forwarded on WhatsApp; the share card
    // should look like the page it opens.
    images: [{ url: "/og-sin.png", width: 1200, height: 630, alt: "BloodThirst — Drink Like You Mean It. Batch 001." }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-sin.png"],
  },
}

export default function SinPage() {
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""

  // /sin currently sells only shipping-ready packs. Default is derived from the
  // same content id the hero uses, so the hero price and checkout default stay
  // aligned.
  const defaultPackId = (getPackById(SIN_ENTRY_PACK_ID) || PACKS[0]).id

  return (
    <div className={anton.variable}>
      <SinClient razorpayKey={razorpayKey} defaultPackId={defaultPackId} />
    </div>
  )
}
