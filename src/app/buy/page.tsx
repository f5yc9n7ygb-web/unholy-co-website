import type { Metadata } from "next"
import { BuyClient } from "./BuyClient"

export const revalidate = 30

const TITLE = "Buy BloodThirst — Still Water. Dead Serious."
const DESCRIPTION =
  "500ml Himalayan natural mineral water in a matte-black aluminium can. From ₹169/can, free delivery across India. Batch 001 — first run."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/buy" },
  // Ad landing page — kept out of the index like /bloodthirst-shop until launch.
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/buy",
    images: [
      { url: "/og-hero.png", width: 1200, height: 630, alt: "BloodThirst — UNHOLY CO." },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-hero.png"],
  },
}

export default function BuyPage() {
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    ""
  return <BuyClient razorpayKey={razorpayKey} />
}
