import { MicroHero } from "@/components/layout/MicroHero"
import Reveal from "@/components/ux/Reveal"

export const metadata = {
  title: "Story — UNHOLY CO.",
  description: "From a vow to destroy plastic bottles in India to a cult-favorite canned water ritual. This is how UNHOLY CO. was forged."
}

const milestones = [
  {
    year: "2021",
    title: "The Vow",
    body: "After witnessing mountains of disposable plastic at festivals, we swore to build a water brand that felt like a rebellion, not a compromise.",
  },
  {
    year: "2022",
    title: "Forging BloodThirst",
    body: "We sourced volcanic aquifer water and engineered aluminum tallboys with a gothic finish that could live in clubs, galleries, and underground venues.",
  },
  {
    year: "2023",
    title: "The First Drop",
    body: "Our launch batch sold out in 48 hours. BloodThirst showed up on DJ riders, in speakeasy fridges, and at dawn recovery circles.",
  },
  {
    year: "2024",
    title: "The Bloodverse",
    body: "We released narrative chapters hidden inside each can to celebrate the mythology — because hydration should also tell a story.",
  },
]

const pillars = [
  {
    title: "Design with bite",
    body: "We obsess over typography, material, and texture so every can looks like an artifact from the future. The aesthetic is as important as the hydration.",
  },
  {
    title: "Planet first",
    body: "Aluminum is infinitely recyclable. Our supply chain is optimized for reuse, from bulk shipping cartons to deposit-return pilots.",
  },
  {
    title: "Community powered",
    body: "BloodThirst lives where counterculture thrives — independent venues, galleries, rider requests, and the people willing to taste something different.",
  },
]

export default function StoryPage() {
  return (
    <div className="section">
      <div className="container space-y-12">
        <MicroHero
          eyebrow="ORIGIN MYTH"
          title="From oath to cult classic."
          description="UNHOLY CO. was born from a late-night promise between friends: kill plastic bottles in India and elevate hydration into a ritual. BloodThirst is the result — a can that looks like sin and tastes like clarity."
          actions={[
            { label: "Taste BloodThirst", href: "/bloodthirst" },
            { label: "Explore the Bloodverse", href: "/bloodverse", variant: "ghost" },
          ]}
        />

        <Reveal>
          <div className="glass-panel space-y-6 text-base md:text-lg leading-relaxed text-offwhite/80">
            <p>
              Water brands typically whisper. We wanted to scream. Instead of clear bottles and beachside marketing, we designed a drink for
              those who live after dark — the artists, producers, designers, and rebels who demand better.
            </p>
            <p>
              Every can of BloodThirst is a statement against waste and mediocrity. It’s naturally mineral-rich, born in volcanic rock,
              and sealed in armor so you can chill it, crush it, and recycle it without guilt.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="glass-panel space-y-4">
              <h2 className="h2">Pillars we live by</h2>
              <div className="grid gap-4">
                {pillars.map((pillar) => (
                  <div key={pillar.title} className="stat-card">
                    <h3 className="text-sm font-semibold uppercase text-bone/80 tracking-wide">{pillar.title}</h3>
                    <p className="mt-2 text-sm text-offwhite/70">{pillar.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="glass-panel space-y-4">
              <h2 className="h2">Timeline</h2>
              <ul className="space-y-4">
                {milestones.map((milestone) => (
                  <li key={milestone.year} className="rounded-2xl border border-ash/40 bg-ash/20 px-4 py-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs uppercase tracking-[0.3em] text-blood/80">{milestone.year}</span>
                      <h3 className="text-base font-semibold text-offwhite">{milestone.title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-offwhite/70">{milestone.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="glass-panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="h2 text-xl md:text-2xl">Join the next chapter</h2>
              <p className="text-sm text-offwhite/70">
                Drops, collabs, and Bloodverse lore arrive to our inner circle first. Become part of the ritual.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="#subscribe" className="btn btn-primary">Join the circle</a>
              <a href="/drops" className="btn btn-ghost">Preview drops</a>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
