// src/app/bloodverse/page.tsx
import Link from "next/link"
import Reveal from "@/components/ux/Reveal"
import { MicroHero } from "@/components/layout/MicroHero"
import { InteractiveVault } from "@/components/ux/InteractiveVault"

export const metadata = {
  title: "The Bloodverse — UNHOLY CO.",
  description: "A living myth. Scan the can, unlock the chapter. Start with: The Reaper Knocks."
}

/**
 * The main page for the Bloodverse, the interactive lore section of the website.
 * This component introduces the concept of the Bloodverse and provides links to available chapters.
 *
 * @returns {JSX.Element} The rendered Bloodverse page.
 */
export default function BloodversePage() {
  return (
    <section className="section">
      <div className="container space-y-12">
        <MicroHero
          eyebrow="INTERACTIVE LORE"
          title="The Bloodverse"
          description="Hydration is the ritual. The can is the altar. Scan the sigil under every tab to unlock the chapter that bleeds through that batch."
          actions={[
            { label: "Start Chapter I", href: "/bloodverse/chapter-1" },
            { label: "Join the circle", href: "#subscribe", variant: "ghost" },
          ]}
        />

        <Reveal>
          <InteractiveVault />
        </Reveal>
      </div>
    </section>
  )
}
