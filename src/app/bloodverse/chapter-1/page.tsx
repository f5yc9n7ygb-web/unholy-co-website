import Link from "next/link"
import Reveal from "@/components/ux/Reveal"
import { MicroHero } from "@/components/layout/MicroHero"

export const metadata = {
  title: "Bloodverse · Chapter I — UNHOLY CO.",
  description: "Chapter I: The Reaper Knocks. A late-night ritual with BloodThirst goes sideways when the can talks back."
}

const RUNE_DATA_URI =
  "url(\"data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>\
  <g fill='none' stroke='%23B00020' stroke-width='4' opacity='0.7'>\
    <path d='M100 12 L58 84 L100 60 L142 84 Z'/>\
    <path d='M100 60 L100 182'/>\
    <circle cx='100' cy='148' r='12'/>\
  </g>\
</svg>\")"

/**
 * The page for Chapter I of the Bloodverse lore, titled "The Reaper Knocks".
 * This component displays the story content for the first chapter, along with
 * related in-universe details and navigation to other parts of the site.
 *
 * @returns {JSX.Element} The rendered Chapter I page.
 */
export default function ChapterOne() {
  return (
    <section className="relative section overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-black">
        <div className="bg-blood-pulse" />
        <div className="rune-bg opacity-[0.18]" style={{ backgroundImage: RUNE_DATA_URI }} />
      </div>

      <div className="container relative z-10 space-y-12">
        <MicroHero
          eyebrow="BLOODVERSE · CHAPTER I"
          title="The Reaper Knocks"
          description="It’s 3:33 a.m. The city hums like a dying fluorescent bulb. Somewhere between a rave and a blackout, you crack open BloodThirst — and the can answers back."
          actions={[
            { label: "All Chapters", href: "/bloodverse", variant: "ghost" },
            { label: "Taste BloodThirst", href: "/bloodthirst" },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr,0.8fr]">
          <Reveal>
            <article className="glass-panel space-y-6 text-lg leading-relaxed tracking-wide text-bone/80">
              <p>The Reaper wasn’t supposed to knock. He was supposed to take. But tonight? He’s thirsty.</p>

              <p>
                It’s 3:33 a.m — the devil’s happy hour. The city hums like a dying fluorescent bulb. Somewhere between a rave
                and a blackout, someone cracks open a can of BloodThirst.
              </p>

              <p className="text-blood italic font-medium">A sound hisses out — not carbonation. A whisper.</p>

              <p className="text-center text-2xl font-medium text-blood/90">“Finally awake, sinner?”</p>

              <p>
                The voice crawls out of the can, smooth and sarcastic. It’s not here to take your soul — just your peace of mind.
                Every sip feels colder than the last. The lights flicker. The room shifts. You swear the can is pulsing, but you
                keep drinking because honestly, what’s the worst that could happen?
              </p>

              <p className="text-blood/90 italic">Somewhere in the corner, your reflection blinks after you do.</p>

              <p>
                You drop the can. It rolls, stops perfectly upright, and the red line on the label glows faintly. A knock echoes —
                one, two, three.
              </p>

              <p>Your phone buzzes. A notification. <strong>Chapter II unlocked: The Feast of Shadows.</strong></p>

              <p>You laugh nervously. “Cool marketing,” you mutter.</p>

              <p className="text-blood italic">But when you check the can again… the QR has changed.</p>
            </article>
          </Reveal>

          <Reveal delay={0.05}>
            <aside className="glass-panel space-y-6">
              <div>
                <h2 className="text-sm uppercase tracking-[0.35em] text-bone/70">Ritual Brief</h2>
                <p className="mt-2 text-sm text-offwhite/70">
                  Scan the re-forged sigil on your can to continue the myth. Each drop unlocks a timeline fragment.
                </p>
              </div>

              <div className="rounded-2xl border border-blood/30 bg-blood/10 px-4 py-5 text-sm text-bone/80">
                <p className="uppercase text-xs tracking-[0.3em] text-blood/80">Unlocked</p>
                <p className="mt-2 font-semibold text-offwhite">Chapter II · The Feast of Shadows</p>
                <p className="mt-2 text-offwhite/70">Access requires the Feast drop or invite code from a coven member.</p>
              </div>

              <div className="grid gap-4">
                <div className="stat-card">
                  <h3 className="text-xs uppercase tracking-wide text-bone/60">Timestamp</h3>
                  <p className="mt-2 text-sm text-offwhite/80">3:33 a.m — Night of the first Mumbai drop.</p>
                </div>
                <div className="stat-card">
                  <h3 className="text-xs uppercase tracking-wide text-bone/60">Witness</h3>
                  <p className="mt-2 text-sm text-offwhite/80">Handle: @NIGHTFEED. Status: Missing (voluntary).</p>
                </div>
                <div className="stat-card">
                  <h3 className="text-xs uppercase tracking-wide text-bone/60">Artifact</h3>
                  <p className="mt-2 text-sm text-offwhite/80">Can #0017 — redline sigil altered post-consumption.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/bloodverse" className="btn btn-ghost">
                  ← Back to Bloodverse
                </Link>
                <Link href="/drops" className="btn btn-primary">
                  Reserve the next drop
                </Link>
              </div>
            </aside>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
