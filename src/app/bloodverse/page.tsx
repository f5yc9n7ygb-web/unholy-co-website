// src/app/bloodverse/page.tsx
import Link from "next/link"
import Reveal from "@/components/ux/Reveal"
import { MicroHero } from "@/components/layout/MicroHero"

export const metadata = {
  title: "The Bloodverse — UNHOLY CO.",
  description: "A living myth. Scan the can, unlock the chapter. Start with: The Reaper Knocks."
}

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

        <div className="grid gap-6 md:grid-cols-3">
          <Reveal>
            <div className="glass-panel space-y-4">
              <h3 className="text-blood text-xl italic">The Reaper Knocks</h3>
              <p className="text-offwhite/80 text-sm">
                It starts with a knock and ends with you questioning your reflection.
              </p>
              <Link href="/bloodverse/chapter-1" className="btn btn-primary">
                Read Chapter
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="glass-panel space-y-4 opacity-60">
              <h3 className="text-blood text-xl italic">The Feast of Shadows</h3>
              <p className="text-offwhite/80 text-sm">
                Coming soon. They drank. The city screamed.
              </p>
              <button className="btn btn-ghost" disabled>
                Locked
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass-panel space-y-4 opacity-60">
              <h3 className="text-blood text-xl italic">The Choir of Ash</h3>
              <p className="text-offwhite/80 text-sm">
                Final chorus meets dawn. Hydration becomes omen.
              </p>
              <button className="btn btn-ghost" disabled>
                Locked
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
