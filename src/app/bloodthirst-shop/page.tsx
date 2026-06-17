import type { Metadata } from "next"
import { headers } from "next/headers"
import { userAgent } from "next/server"
import { BloodThirstShopClient } from "./BloodThirstShopClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "BloodThirst Shop - Hydration for the Unholy",
  description:
    "Premium mountain water in a can built for stories, stares, gifting, and questionable choices. Start with 1 can from ₹299.",
  alternates: { canonical: "/bloodthirst-shop" },
  // Keep this route private until launch — not indexed.
  robots: { index: false, follow: false },
  openGraph: {
    title: "BloodThirst Shop - Hydration for the Unholy",
    description:
      "Premium mountain water in a can built for stories, stares, gifting, and questionable choices.",
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
    title: "BloodThirst Shop - Hydration for the Unholy",
    description:
      "Premium mountain water in a can built for stories, stares, gifting, and questionable choices.",
    images: ["/og-hero.png"],
  },
}

export default async function BloodThirstShopPage() {
  const requestHeaders = await headers()
  const ua = userAgent({ headers: requestHeaders })
  const isMobile = ua.device.type === "mobile"
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    ""
  return <BloodThirstShopClient razorpayKey={razorpayKey} isMobile={isMobile} />
}
