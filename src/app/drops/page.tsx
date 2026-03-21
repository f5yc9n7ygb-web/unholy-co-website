import type { Metadata } from "next"
import { DropsClient } from "./DropsClient"

export const metadata: Metadata = {
  title: "Drops",
  description: "Limited-edition BloodThirst runs, collabs, and ritual-only flavors. Reserve yours before the coven drinks them dry.",
  alternates: { canonical: '/drops' },
  openGraph: {
    title: "Drops — UNHOLY CO.",
    description: "Limited-edition BloodThirst runs, collabs, and ritual-only flavors. Reserve yours before the coven drinks them dry.",
    url: '/drops',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'UNHOLY CO. Limited Drops' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Drops — UNHOLY CO.",
    description: "Limited-edition BloodThirst runs, collabs, and ritual-only flavors. Reserve yours before the coven drinks them dry.",
    images: ['/og-hero.png'],
  },
}

export default function DropsPage() {
  return <DropsClient />
}
