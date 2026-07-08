import Hero2026 from "@/components/home2026/Hero2026"
import { LedgerStrip } from "@/components/home2026/LedgerStrip"
import Record2026 from "@/components/home2026/Record2026"
import Gallery2026 from "@/components/home2026/Gallery2026"
import Manifesto2026 from "@/components/home2026/Manifesto2026"
import Ritual2026 from "@/components/home2026/Ritual2026"
import Transmission2026 from "@/components/home2026/Transmission2026"

export const revalidate = 60

/**
 * Homepage — 2026 "COLD LIGHT ARCHIVE" overhaul. The previous iteration
 * (glass-bento + 400vh horizontal scroll-jack) lives on in git history and in
 * the unused src/components/home/ directory; copy is centralized in
 * src/content/home2026.ts.
 */
export default function HomePage() {
  return (
    <div className="relative bg-[#060606]">
      <Hero2026 />
      <LedgerStrip />
      <Record2026 />
      <Gallery2026 />
      <Manifesto2026 />
      <Ritual2026 />
      <Transmission2026 />
    </div>
  )
}
