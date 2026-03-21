import type { Metadata } from "next"
import { StoryClient } from "./StoryClient"

export const metadata: Metadata = {
  title: "Our Story",
  description: "From a vow to destroy plastic bottles in India to a cult-favorite canned water ritual. This is how UNHOLY CO. was forged.",
  alternates: { canonical: '/story' },
  openGraph: {
    title: "Our Story — UNHOLY CO.",
    description: "From a vow to destroy plastic bottles in India to a cult-favorite canned water ritual. This is how UNHOLY CO. was forged.",
    url: '/story',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'The Story of UNHOLY CO.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Our Story — UNHOLY CO.",
    description: "From a vow to destroy plastic bottles in India to a cult-favorite canned water ritual. This is how UNHOLY CO. was forged.",
    images: ['/og-hero.png'],
  },
}

export default function StoryPage() {
  return <StoryClient />
}
