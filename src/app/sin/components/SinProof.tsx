"use client"

import { SIN_PROOF } from "@/content/sin"
import { SectionTitle } from "./marks"
import { Reveal } from "./Reveal"

/**
 * Proof — the page's biggest missing conversion lever, finally present. Witness
 * statements (rating-free by brand rule) framed as case-file testimony, plus a
 * qualitative credibility strip. No counts anywhere: trust signals only.
 */
export function SinProof() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl px-5 py-20 md:px-10 md:py-28">
      <Reveal>
        <SectionTitle kicker={SIN_PROOF.kicker} title={SIN_PROOF.title} />
      </Reveal>
      <Reveal delay={60}>
        <p className="-mt-6 mb-10 max-w-xl font-mono text-[11px] uppercase tracking-[0.24em] text-bone/45">
          {SIN_PROOF.subtitle}
        </p>
      </Reveal>

      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {SIN_PROOF.statements.map((s, i) => (
          <Reveal key={s.quote} delay={i * 70} className="mb-4 break-inside-avoid">
            <figure className="group relative border border-bone/12 bg-[#0b0b0b]/70 p-6 transition-colors duration-300 hover:border-blood/40 md:p-7">
              {/* oversized quote glyph, like a stamped exhibit mark */}
              <span
                aria-hidden
                className="pointer-events-none absolute right-4 top-1 font-cinzel text-5xl leading-none text-blood/15 transition-colors duration-300 group-hover:text-blood/30"
              >
                &rdquo;
              </span>
              <blockquote className="relative font-cinzel text-lg font-bold leading-snug text-offwhite/90 md:text-xl">
                {s.quote}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-2.5 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/45">
                <span aria-hidden className="h-px w-5 bg-blood/70" />
                {s.attr}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      {/* qualitative credibility — trust signals, never a buyer count */}
      <Reveal delay={120} className="mt-10">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-y border-bone/12 bg-black/30 px-5 py-4 font-mono text-[9px] uppercase tracking-[0.26em] text-bone/55 md:text-[10px]">
          {SIN_PROOF.credibility.map((c, i) => (
            <span key={c} className="inline-flex items-center gap-3 whitespace-nowrap">
              {i > 0 && <span aria-hidden className="text-blood/55">/</span>}
              {c}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
