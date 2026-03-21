import type { Metadata } from "next"
import ChapterOneClient from "./ChapterOneClient"

export const metadata: Metadata = {
  title: "Chapter I: The Reaper Knocks",
  description: "3:33 AM. Mumbai. A delivery arrives that you don't remember ordering. You crack open BloodThirst — and the can answers back.",
  alternates: { canonical: '/bloodverse/chapter-1' },
  openGraph: {
    title: "Chapter I: The Reaper Knocks — Bloodverse — UNHOLY CO.",
    description: "3:33 AM. Mumbai. A delivery arrives that you don't remember ordering. You crack open BloodThirst — and the can answers back.",
    url: '/bloodverse/chapter-1',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'Bloodverse Chapter I — UNHOLY CO.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Chapter I: The Reaper Knocks — Bloodverse",
    description: "3:33 AM. Mumbai. A delivery arrives that you don't remember ordering. You crack open BloodThirst — and the can answers back.",
    images: ['/og-hero.png'],
  },
}

export default function ChapterOnePage() {
  return <ChapterOneClient />
}
