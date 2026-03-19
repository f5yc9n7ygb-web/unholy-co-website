import type { Metadata } from "next"
import { BloodverseHero } from "./BloodverseHero"
import { LazyInteractiveVault } from "@/components/ux/LazyInteractiveVault"

export const metadata: Metadata = {
  title: "The Bloodverse — UNHOLY CO.",
  description: "A living myth. Scan the can, unlock the chapter. Start with: The Reaper Knocks.",
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
