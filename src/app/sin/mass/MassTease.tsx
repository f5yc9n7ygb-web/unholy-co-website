"use client"

import { MASS_TEASE } from "@/content/sin-mass"
import { Slam, Stamp } from "./theme"

/**
 * Classified band — the door to the Forbidden Shelf. Restores the deep-scroll
 * driver the rebuild dropped: a slim, subordinate strip (never a blood CTA)
 * that anchor-scrolls DOWN to the on-page vault. No off-site leak.
 */
export function MassTease({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="relative bg-[#050505] px-4 pb-4 md:px-10">
      <Slam>
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4 border-2 border-offwhite/20 px-5 py-4 md:px-7 md:py-5">
          <div className="flex min-w-0 items-center gap-4">
            <Stamp tone="blood" rotate={-2} className="px-2 py-1 text-[8px]">
              {MASS_TEASE.tag}
            </Stamp>
            <p className="font-anton text-lg uppercase leading-tight tracking-[0.03em] text-offwhite md:text-xl">
              {MASS_TEASE.line}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 border-2 border-offwhite/30 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-bone/80 transition-colors duration-150 hover:border-blood hover:text-blood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offwhite"
          >
            {MASS_TEASE.cta}
            <span aria-hidden>↓</span>
          </button>
        </div>
      </Slam>
    </section>
  )
}
