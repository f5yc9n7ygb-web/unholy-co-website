"use client"

import { BUY_HERO, BUY_INDEX, FILE_CHROME } from "@/content/bloodthirst-buy"
import { Redacted, Stamp } from "./DocBits"

/** "STILL WATER. DEAD SERIOUS." → one poster-scale word per line */
const HEADLINE_WORDS = BUY_HERO.headline.flatMap((line) => line.split(" "))

/**
 * Above-the-fold: the cover page of the file.
 *
 * The can collides with the headline — "DEAD SERIOUS." is rendered twice in
 * one grid cell: a solid copy that sits UNDER the can (z-auto < z-10) and an
 * outline-only copy ON TOP of it (z-20). Where there's no can the two copies
 * align exactly and read as solid type; where the can crosses, the outline
 * carries the letterforms over the metal. No measurement, no JS — it can't
 * misalign because both copies share the same grid cell and styles.
 *
 * Entrance stays CSS-only (`animate-step-in`) so the fold paints pre-hydration.
 */
export function Hero({ onBuy }: { onBuy: () => void }) {
  return (
    <section
      id="bt-hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pt-16 md:px-10 md:pt-20"
    >
      {/* file chrome — top rule */}
      <div
        className="flex items-baseline justify-between border-b border-bone/25 pb-2 font-mono text-[8px] uppercase tracking-[0.28em] text-bone/60 opacity-0 animate-step-in md:text-[10px]"
        style={{ animationDelay: "0.1s" }}
      >
        <span>{FILE_CHROME.form}</span>
        <span>{FILE_CHROME.fileNo}</span>
      </div>

      {/* ── headline × can collision ──
          One word per line at poster scale. Each word is rendered twice in
          one grid cell: solid copy under the can, outline copy over it — the
          can interrupts the letterforms without losing a single character.
          The wrapper is w-fit so the can's percentage offsets track the TYPE,
          not the viewport — the collision point is identical at every width.
          On lg+, SUBJECT + CTA move into the right column beside the type. */}
      <div className="lg:grid lg:grid-cols-[auto,1fr] lg:items-center lg:gap-16">
      <div className="relative mt-8 w-fit md:mt-10">
        {/* 7rem cap keeps the 4-line stack + subject + CTA above the fold on desktop */}
        <h1 className="font-cinzel text-[clamp(3.1rem,15vw,7rem)] font-black uppercase leading-[0.9] tracking-[-0.01em] text-offwhite">
          {HEADLINE_WORDS.map((word, i) => (
            <span
              key={word}
              className="grid w-fit opacity-0 animate-step-in"
              style={{ animationDelay: `${0.18 + i * 0.08}s` }}
            >
              {/* solid copy — sits under the can */}
              <span className="[grid-area:1/1]">{word}</span>
              {/* outline copy — rides over the can */}
              <span
                aria-hidden
                className="z-20 [grid-area:1/1] text-transparent"
                style={{ WebkitTextStroke: "1.5px rgba(246,246,246,0.92)" }}
              >
                {word}
              </span>
            </span>
          ))}
        </h1>

        {/* the can — z-10: above solid type, under the outline copies.
            No drop-shadow filter: a 50px-blur filter on a large layer is
            expensive on mid-range phones AND it breaks Chrome's tab capture
            (solid black frames). No LQIP background either — the source webp
            has transparent padding, so a cover background leaks through it
            as a milky halo around the can. */}
        <img
          src="/bloodthirst-hero.webp"
          srcSet="/bloodthirst-hero-m.webp 720w, /bloodthirst-hero.webp 1100w"
          sizes="(max-width: 768px) 44vw, 28vw"
          alt="BloodThirst — matte-black 500ml can of natural mineral water"
          fetchPriority="high"
          decoding="async"
          className="absolute bottom-0 left-[68%] z-10 h-[88%] w-auto object-contain opacity-0 animate-step-in"
          style={{ animationDelay: "0.05s" }}
        />

        {/* batch stamp — slapped across the can */}
        <div
          className="absolute left-[55%] top-[66%] z-30 opacity-0 animate-step-in"
          style={{ animationDelay: "0.75s" }}
        >
          <Stamp rotate={-8}>{BUY_HERO.stamp}</Stamp>
        </div>
      </div>

      {/* SUBJECT + CTA — below the type on mobile, beside it on lg+ */}
      <div className="lg:max-w-[30rem] lg:pl-6">
      {/* ── SUBJECT line — document field, plain-English clarity ── */}
      <p
        className="mt-9 max-w-[34rem] border-l-2 border-blood/70 pl-4 text-sm leading-relaxed text-bone/72 opacity-0 animate-step-in md:mt-8 lg:mt-0 md:text-base"
        style={{ animationDelay: "0.45s" }}
      >
        <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/55">
          {BUY_HERO.subjectLabel} —
        </span>
        {BUY_HERO.subject}
      </p>

      {/* ── CTA ── */}
      <div
        className="mt-7 opacity-0 animate-step-in md:mt-9"
        style={{ animationDelay: "0.6s" }}
      >
        <a
          href="#bt-buy"
          onClick={onBuy}
          className="inline-flex w-full max-w-[24rem] items-center justify-center gap-3 border border-blood bg-blood px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-offwhite transition-colors duration-300 hover:bg-blood/85 md:w-auto"
        >
          {BUY_HERO.cta}
          <span aria-hidden className="inline-block h-px w-5 bg-offwhite/70" />
        </a>
        <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.24em] text-bone/60">
          {BUY_HERO.ctaMeta}
        </p>
      </div>
      </div>
      </div>

      {/* ── VERIFIED row — bottom rule of the cover page ── */}
      <div
        className="mb-5 mt-auto pt-10 opacity-0 animate-step-in"
        style={{ animationDelay: "0.75s" }}
      >
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 border-t border-bone/25 pt-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blood/90">
            {BUY_HERO.verifiedLabel}:
          </span>
          {BUY_HERO.trust.map((t) => (
            <span
              key={t}
              className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone/62"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Static index strip — the file's table of contents. One entry stays redacted. */
export function IndexStrip() {
  return (
    <div className="border-y-[3px] border-double border-bone/25 px-5 py-3 md:px-10">
      <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.3em] text-bone/60 md:text-[10px]">
        <span className="mr-3 text-blood/90">{BUY_INDEX.label} /</span>
        {BUY_INDEX.items.map((item) => (
          <span key={item} className="whitespace-nowrap">
            {item}
            <span aria-hidden className="mx-2 text-bone/30">/</span>
          </span>
        ))}
        <Redacted>{BUY_INDEX.redacted}</Redacted>
      </p>
    </div>
  )
}
