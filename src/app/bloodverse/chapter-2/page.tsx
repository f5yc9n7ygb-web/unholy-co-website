import type { Metadata } from "next"
import ChapterTwoClient from "./ChapterTwoClient"

export const metadata: Metadata = {
  title: "Chapter II: The Feast of Shadows",
  description: "72 hours later. Seventeen strangers. One table. The cans glow in the dark. An interactive story experience.",
  alternates: { canonical: '/bloodverse/chapter-2' },
  openGraph: {
    title: "Chapter II: The Feast of Shadows — Bloodverse — UNHOLY CO.",
    description: "72 hours later. Seventeen strangers. One table. The cans glow in the dark. An interactive story experience.",
    url: '/bloodverse/chapter-2',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'Bloodverse Chapter II — UNHOLY CO.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Chapter II: The Feast of Shadows — Bloodverse",
    description: "72 hours later. Seventeen strangers. One table. The cans glow in the dark.",
    images: ['/og-hero.png'],
  },
}

export default function ChapterTwoPage() {
  return <ChapterTwoClient />
}
