import type { Metadata } from "next"
import ChapterThreeClient from "./ChapterThreeClient"

export const metadata: Metadata = {
  title: "Chapter III: The Choir of Ash",
  description: "Dawn. The rooftop. Seventeen voices. The ash rises. The truth behind BloodThirst is revealed.",
  alternates: { canonical: '/bloodverse/chapter-3' },
  openGraph: {
    title: "Chapter III: The Choir of Ash — Bloodverse — UNHOLY CO.",
    description: "Dawn. The rooftop. Seventeen voices. The ash rises. The truth behind BloodThirst is revealed.",
    url: '/bloodverse/chapter-3',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'Bloodverse Chapter III — UNHOLY CO.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Chapter III: The Choir of Ash — Bloodverse",
    description: "Dawn. The rooftop. Seventeen voices. The ash rises. The truth behind BloodThirst is revealed.",
    images: ['/og-hero.png'],
  },
}

export default function ChapterThreePage() {
  return <ChapterThreeClient />
}
