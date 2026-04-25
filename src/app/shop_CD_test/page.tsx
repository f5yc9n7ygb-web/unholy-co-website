import type { Metadata } from "next"
import { ShopCDTestClient } from "./ShopCDTestClient"

export const revalidate = 30

export const metadata: Metadata = {
  title: "Seal the Pact — BloodThirst",
  description: "One can. One pact. Himalayan mineral water for the unholy few. Batch 001 — claim your seal.",
  alternates: { canonical: "/shop_CD_test" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Seal the Pact — UNHOLY CO.",
    description: "Himalayan mineral water for the unholy few. Batch 001 open.",
    url: "/shop_CD_test",
    images: [{ url: "/og-hero.png", width: 1200, height: 630, alt: "BloodThirst — Seal the Pact" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seal the Pact — UNHOLY CO.",
    description: "Himalayan mineral water for the unholy few. Batch 001 open.",
    images: ["/og-hero.png"],
  },
}

export default function ShopCDTestPage() {
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""
  return <ShopCDTestClient razorpayKey={razorpayKey} />
}
