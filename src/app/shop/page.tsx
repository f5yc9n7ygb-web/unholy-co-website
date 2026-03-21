import type { Metadata } from "next"
import { ShopClient } from "./ShopClient"

export const metadata: Metadata = {
  title: "Shop BloodThirst",
  description: "Order BloodThirst cans directly from the coven. Choose your ritual pack and get cold-forged hydration delivered.",
  alternates: { canonical: '/shop' },
  openGraph: {
    title: "Shop BloodThirst — UNHOLY CO.",
    description: "Order BloodThirst cans directly from the coven. Choose your ritual pack and get cold-forged hydration delivered.",
    url: '/shop',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'Shop BloodThirst — UNHOLY CO.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Shop BloodThirst — UNHOLY CO.",
    description: "Order BloodThirst cans directly from the coven. Choose your ritual pack and get cold-forged hydration delivered.",
    images: ['/og-hero.png'],
  },
}

/**
 * The server-side component for the shop page.
 * Reads the Razorpay key at request time (from runtime secrets) and passes
 * it as a prop to the client — avoids dependency on NEXT_PUBLIC build-time baking.
 */
export default function ShopPage() {
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""
  return <ShopClient razorpayKey={razorpayKey} />
}
