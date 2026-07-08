"use client"

import { MASS_PROOF } from "@/content/sin-mass"
import { Slam, SlabHead } from "./theme"

/**
 * FIELD NOTES — a sticker wall. Offwhite paper cards with black type, pinned
 * at slight angles to the black slab with hard red shadows. Rating-free brand
 * voice (guardrail: these are NOT customer quotes and never carry counts or
 * verification badges).
 */
export function MassProof() {
  return (
    <section id="sin-proof" className="relative bg-[#050505] px-4 py-16 md:px-10 md:py-24">
      <div className="mx-auto w-full max-w-5xl">
        <Slam>
          <SlabHead stamp={MASS_PROOF.stamp} title={MASS_PROOF.title} sub={MASS_PROOF.sub} />
        </Slam>

        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {MASS_PROOF.notes.map((note, i) => (
            <Slam key={note.quote} delay={i * 70} className="mb-5 break-inside-avoid">
              <figure
                className="border-2 border-[#050505] bg-offwhite p-5 shadow-[7px_7px_0_#B00020] md:p-6"
                style={{ transform: `rotate(${i % 2 ? 1 : -1.2}deg)` }}
              >
                <blockquote className="font-anton text-xl uppercase leading-[1.06] tracking-[0.02em] text-[#050505] md:text-2xl">
                  “{note.quote}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-[#050505]/60">
                  <span aria-hidden className="h-[3px] w-6 bg-blood" />
                  {note.tag}
                </figcaption>
              </figure>
            </Slam>
          ))}
        </div>

        {/* credibility strip — trust signals only, never a buyer count */}
        <Slam delay={120}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-2 border-offwhite/20 px-5 py-4">
            {MASS_PROOF.strip.map((item, i) => (
              <span
                key={item}
                className="flex items-center gap-5 font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-bone/65 md:text-[10px]"
              >
                {i > 0 && (
                  <span aria-hidden className="text-blood">
                    ✕
                  </span>
                )}
                {item}
              </span>
            ))}
          </div>
        </Slam>
      </div>
    </section>
  )
}
