// src/app/bloodthirst/page.tsx
import Image from "next/image"
import Link from "next/link"
import Parallax from "@/components/ux/Parallax"
import Reveal from "@/components/ux/Reveal"
import { MicroHero } from "@/components/layout/MicroHero"
import heroCan from "@/../public/can.png"

export const metadata = {
  title: "BloodThirst — UNHOLY CO.",
  description: "Premium natural mineral water in aluminum. Smooth minerality. No plastic funk."
}

const tastingNotes = [
  {
    title: "Opening Hit",
    body: "Glacial cold snap up front with a metallic kiss — wakes the palate like a midnight siren.",
  },
  {
    title: "Mid-Palate",
    body: "Obsidian-filtered mineral blend keeps things razor clean; no plastic funk, no chemical afterthought.",
  },
  {
    title: "Finale",
    body: "Dry noble finish that lingers just long enough to remind you you’re alive. Best served at 2°C.",
  },
]

const specs = [
  { label: "Format", value: "330ml aluminum tallboy" },
  { label: "Mineral Profile", value: "Calcium · Magnesium · Potassium · Bicarbonates" },
  { label: "Source", value: "Volcanic aquifer — 5,200 ft elevation" },
  { label: "Upkeep", value: "Store cold · Crack with intent · Crush · Recycle" },
]

/**
 * The BloodThirst product page.
 * This component provides a detailed overview of the BloodThirst product,
 * including tasting notes, specifications, and a call to action to shop.
 *
 * @returns {JSX.Element} The rendered BloodThirst product page.
 */
export default function BloodThirstPage() {
  return (
    <div className="section">
      <div className="container space-y-12">
        <MicroHero
          eyebrow="FLAGSHIP ELIXIR"
          title="BloodThirst"
          description="Natural mineral water armored in obsidian-black aluminum. Crafted for night rituals, backstage riders, and anyone bored of basic hydration."
          actions={[
            { label: "Shop Packs", href: "/shop" },
            { label: "Enter the Bloodverse", href: "/bloodverse", variant: "ghost" },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] items-start">
          <div className="space-y-6">
            <Reveal>
              <div className="glass-panel space-y-4">
                <h2 className="h2">Taste arc</h2>
                <p className="p">
                  A three-act experience engineered for slow sips or quick annihilation. Keep it ice-bath cold and crack it when the lights dim.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {tastingNotes.map((note) => (
                    <div key={note.title} className="stat-card">
                      <h3 className="text-sm font-semibold uppercase text-bone/80 tracking-wide">{note.title}</h3>
                      <p className="mt-2 text-xs text-offwhite/70 sm:text-sm">{note.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div className="glass-panel space-y-5">
                <h2 className="h2">Specs + ritual</h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {specs.map((spec) => (
                    <div key={spec.label} className="group">
                      <dt className="text-xs uppercase tracking-wide text-bone/60">{spec.label}</dt>
                      <dd className="text-sm text-offwhite/80 group-hover:text-offwhite transition">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="rounded-2xl border border-blood/30 bg-blood/10 px-4 py-3 text-sm text-bone/80">
                  Chill to 2°C, crack with intent, sip straight or pour over black rock ice. Finish with a can crush — ritual law.
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="flex flex-wrap gap-3">
                <Link href="/shop" className="btn btn-primary">
                  Order BloodThirst
                </Link>
                <Link href="/drops" className="btn btn-ghost">
                  Track new drops
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <Parallax amt={90}>
              <div className="glass-panel h-full overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(800px_480px_at_70%_20%,rgba(176,0,32,0.32),transparent_65%)]" />
                <div className="relative h-[360px] sm:h-[420px] md:h-[520px] w-full">
                  <Image
                    src={heroCan}
                    alt="BloodThirst can"
                    fill
                    className="object-contain animate-float drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
                    priority
                  />
                </div>
              </div>
            </Parallax>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
