import type { Metadata } from "next"
import { BloodThirstShopClient } from "./BloodThirstShopClient"

export const revalidate = 30

export const metadata: Metadata = {
  title: "BloodThirst — Still Water. Dead Serious.",
  description:
    "Himalayan mineral water for the kind of person who already knows the difference. 500ml. No apology.",
  alternates: { canonical: "/bloodthirst-shop" },
  // Keep this route private until launch — not indexed.
  robots: { index: false, follow: false },
  openGraph: {
    title: "BloodThirst — Still Water. Dead Serious.",
    description:
      "Himalayan mineral water for the kind of person who already knows the difference. 500ml. No apology.",
    url: "/bloodthirst-shop",
    images: [
      {
        url: "/og-hero.png",
        width: 1200,
        height: 630,
        alt: "BloodThirst — UNHOLY CO.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BloodThirst — Still Water. Dead Serious.",
    description:
      "Himalayan mineral water for the kind of person who already knows the difference.",
    images: ["/og-hero.png"],
  },
}

export default function BloodThirstShopPage() {
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    ""
  return <BloodThirstShopClient razorpayKey={razorpayKey} />
}
