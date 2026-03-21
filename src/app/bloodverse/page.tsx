import type { Metadata } from "next"
import { BloodverseHero } from "./BloodverseHero"
import { LazyInteractiveVault } from "@/components/ux/LazyInteractiveVault"

export const metadata: Metadata = {
  title: "The Bloodverse",
  description: "A living myth. Scan the can, unlock the chapter. Start with: The Reaper Knocks.",
  alternates: { canonical: '/bloodverse' },
  openGraph: {
    title: "The Bloodverse — UNHOLY CO.",
    description: "A living myth. Scan the can, unlock the chapter. Start with: The Reaper Knocks.",
    url: '/bloodverse',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'The Bloodverse — UNHOLY CO.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "The Bloodverse — UNHOLY CO.",
    description: "A living myth. Scan the can, unlock the chapter. Start with: The Reaper Knocks.",
    images: ['/og-hero.png'],
  },
}

export default function BloodversePage() {
  return (
    <>
      <BloodverseHero />
      {/* No Reveal wrapper — the vault has its own entrance animations
          and Reveal's opacity:0 conflicts with the lazy-loaded component */}
      <LazyInteractiveVault />
    </>
  )
}
