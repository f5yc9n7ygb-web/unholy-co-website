"use client"

import { SIN_TEASER } from "@/content/sin"
import { Reveal } from "./Reveal"

/**
 * Mid-page teaser — the "door" to the theater. Sits roughly mid-page (after the
 * offer + proof) because a cold buyer will never scroll to the basement to find
 * the vault on their own. Deliberately a GHOST button, not a blood CTA, so it
 * stays subordinate to the real ACQUIRE actions — and its arrow points DOWN
 * because it anchor-scrolls to the on-page vault rather than leaking off-site.
 */
export function SinTeaser({ onPick }: { onPick: () => void }) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-4xl px-5 py-14 md:px-10 md:py-20">
      <Reveal>
        <div className="relative overflow-hidden border border-bone/15 bg-black/45 p-7 md:p-10">
          {/* classified corner stamp */}
          <span className="pointer-events-none absolute -right-px -top-px rotate-0 border border-blood/40 bg-blood/[0.06] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.28em] text-blood/85">
            {SIN_TEASER.tag}
          </span>

          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45">
            <span aria-hidden className="mr-3 inline-block h-px w-7 align-middle bg-blood/80" />
            FILE: RESTRICTED
          </p>

          <h2 className="mt-5 max-w-2xl font-cinzel text-[clamp(1.5rem,4vw,2.5rem)] font-black uppercase leading-[1.05] tracking-[-0.01em] text-offwhite">
            {SIN_TEASER.line}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-bone/60 md:text-base">
            {SIN_TEASER.body}
          </p>

          <button
            type="button"
            onClick={onPick}
            className="group mt-7 inline-flex items-center gap-3 border border-bone/25 bg-transparent px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.34em] text-offwhite transition-colors duration-300 hover:border-blood/70 hover:text-blood"
          >
            <span>{SIN_TEASER.cta}</span>
            <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-y-1">
              ↓
            </span>
          </button>
        </div>
      </Reveal>
    </section>
  )
}
