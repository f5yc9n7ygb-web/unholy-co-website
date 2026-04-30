import type { Metadata } from "next"
import { ShopCDTestClient } from "./ShopCDTestClient"

export const revalidate = 30

export const metadata: Metadata = {
  title: "Shop BloodThirst",
  description: "Choose your BloodThirst pack, review GST-inclusive pricing, and check out securely with Razorpay.",
  alternates: { canonical: "/shop_CD_test" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Shop BloodThirst — UNHOLY CO.",
    description: "Himalayan mineral water in 500ml matte-black cans. Free shipping across India.",
    url: "/shop_CD_test",
    images: [{ url: "/og-hero.png", width: 1200, height: 630, alt: "Shop BloodThirst — UNHOLY CO." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop BloodThirst — UNHOLY CO.",
    description: "Choose your BloodThirst pack and check out securely.",
    images: ["/og-hero.png"],
  },
}

export default function ShopCDTestPage() {
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""
  return <ShopCDTestClient razorpayKey={razorpayKey} />
}
