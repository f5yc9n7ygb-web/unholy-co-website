"use client"

import { PACKS, getPackById } from "@/lib/shop/catalog"
import {
  SIN_AVAILABLE_PACK_IDS,
  SIN_DISPATCH,
  SIN_ENTRY_PACK_ID,
  SIN_HERO,
  SIN_SPECS,
} from "@/content/sin"
import { SinDispatch } from "./SinDispatch"

/**
 * Above-the-fold: the specimen under glass.
 *
 * The can is an ATMOSPHERIC BACKDROP (absolute, spotlit) rather than a column
 * of its own, so the price chip + CTA sit directly under the headline and stay
 * above the fold on a 360px phone. Entrance is CSS-only (`animate-step-in`) so
 * the fold paints before hydration; no WebGL / GSAP / Lenis anywhere.
 */
export function SinHero({
  onBuy,
}: {
  onBuy: () => void
}) {
  // Hero price is derived from the SAME pack the page default-selects — they can
  // never disagree. Floor per-can is limited to packs currently available on
  // /sin, so hidden single/trial packs don't affect the ad-facing math.
  const entry = getPackById(SIN_ENTRY_PACK_ID) || PACKS[0]
  const availablePacks = PACKS.filter((p) =>
    SIN_AVAILABLE_PACK_IDS.includes(p.id as (typeof SIN_AVAILABLE_PACK_IDS)[number])
  )
  const floorPerCan = Math.min(...(availablePacks.length ? availablePacks : PACKS).map((p) => p.perCan))

  return (
    <section
      id="sin-hero"
      className="relative flex min-h-[100dvh] flex-col overflow-hidden px-5 pb-7 pt-20 md:px-10 md:pb-12 md:pt-28"
    >
      {/* ── Spotlit can backdrop ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {/* light pool behind the can */}
        <div
          className="absolute right-[-14%] top-1/2 h-[78vmin] w-[78vmin] -translate-y-1/2 rounded-full opacity-90 md:right-[2%]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(176,0,32,0.20), rgba(176,0,32,0.05) 45%, transparent 72%)",
            animation: "sin-breathe 7s ease-in-out infinite",
          }}
        />
        <img
          src="/bloodthirst-hero.webp"
          srcSet="/bloodthirst-hero-m.webp 720w, /bloodthirst-hero.webp 1100w"
          sizes="(max-width: 768px) 70vw, 42vw"
          alt="BloodThirst — matte-black 500ml can of natural mineral water"
          fetchPriority="high"
          decoding="async"
          className="absolute bottom-[6%] right-[-22%] z-0 h-[64%] w-auto max-w-none object-contain opacity-0 animate-step-in sm:right-[-12%] md:right-[3%] md:h-[82%] lg:right-[6%]"
          style={{ animationDelay: "0.05s" }}
        />
        {/* readability scrim — keeps the type crisp over the metal */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #070707 8%, rgba(7,7,7,0.78) 38%, rgba(7,7,7,0.25) 64%, transparent 86%)",
          }}
        />
        {/* bottom scrim — keeps the dispatch / trust micro-text crisp where it
            crosses the can, strongest on phones (offer block sits lower there) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[52%] md:h-[34%]"
          style={{
            background:
              "linear-gradient(to top, #070707 16%, rgba(7,7,7,0.5) 52%, transparent)",
          }}
        />
        {/* slow cold-light glint travelling across the can */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -inset-y-10 right-0 w-[26%] md:w-[18%]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(246,246,246,0.13) 50%, transparent)",
              filter: "blur(6px)",
              mixBlendMode: "screen",
              animation: "sin-sweep 9s cubic-bezier(0.4,0,0.2,1) 1.4s infinite",
            }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-1 flex-col">
        <p
          className="opacity-0 animate-step-in"
          style={{ animationDelay: "0.12s" }}
        >
          <span className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/55 md:text-[11px]">
            <span aria-hidden className="h-px w-7 bg-blood/80" />
            {SIN_HERO.kicker}
          </span>
        </p>

        <h1 className="mt-7 font-cinzel text-[clamp(2.9rem,13vw,7.5rem)] font-black uppercase leading-[0.88] tracking-[-0.01em] text-offwhite md:mt-9">
          {SIN_HERO.headline.map((line, i) => {
            const last = i === SIN_HERO.headline.length - 1
            return (
              <span
                key={line}
                className="relative block w-fit opacity-0 animate-step-in"
                style={{ animationDelay: `${0.2 + i * 0.09}s` }}
              >
                {line}
                {last && (
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-[3px] w-full origin-left bg-blood"
                    style={{ animation: "sin-seam 0.7s 0.7s cubic-bezier(0.16,1,0.3,1) both" }}
                  />
                )}
              </span>
            )
          })}
        </h1>

        <p
          className="mt-7 max-w-[30rem] border-l-2 border-blood/70 pl-4 text-sm leading-relaxed text-bone/72 opacity-0 animate-step-in md:text-[15px]"
          style={{ animationDelay: "0.5s" }}
        >
          {SIN_HERO.subject}
        </p>

        {/* ── Offer block: price chip + CTA (above the fold) ── */}
        <div
          className="mt-8 opacity-0 animate-step-in md:mt-10"
          style={{ animationDelay: "0.62s" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            {/* live "from" price chip */}
            <div className="inline-flex items-stretch self-start border border-bone/20 bg-black/45 backdrop-blur-sm">
              <div className="flex flex-col justify-center gap-1 border-r border-bone/15 px-4 py-3">
                <span className="font-mono text-[8px] uppercase tracking-[0.32em] text-blood/90">
                  {SIN_HERO.chipLabel}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone/60">
                  {entry.qty} cans · ₹{entry.perCan}/can
                </span>
              </div>
              <div className="flex items-center px-5">
                <span className="font-cinzel text-3xl font-black tabular-nums leading-none text-offwhite md:text-4xl">
                  ₹{entry.price.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* primary CTA */}
            <button
              type="button"
              onClick={onBuy}
              className="group inline-flex items-center justify-center gap-3 border border-blood bg-blood px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.35em] text-offwhite shadow-[0_18px_60px_-12px_rgba(176,0,32,0.7)] transition-colors duration-300 hover:bg-[#c4072a] sm:px-10"
            >
              {SIN_HERO.ctaPrimary}
              <span
                aria-hidden
                className="inline-block h-px w-5 bg-offwhite/70 transition-all duration-300 group-hover:w-9"
              />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-bone/40">
              {SIN_HERO.chipNote} · down to ₹{floorPerCan}/can by the crate
            </span>
          </div>

          {/* honest urgency — live dispatch cutoff + first-run edition, no counts */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <SinDispatch />
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-bone/40">
              {SIN_DISPATCH.editionNote}
            </span>
          </div>
        </div>

        {/* ── Trust seam pinned to the bottom of the fold ── */}
        <div
          className="mt-auto pt-9 opacity-0 animate-step-in"
          style={{ animationDelay: "0.78s" }}
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-bone/15 pt-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blood/90">
              VERIFIED:
            </span>
            {SIN_HERO.trust.map((t) => (
              <span
                key={t}
                className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone/60"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Thin spec seam under the hero — scannable proof the water is real. */
export function SpecSeam() {
  return (
    <div className="relative z-10 border-y border-bone/12 bg-black/30 px-5 py-3 md:px-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-bone/55 md:text-[10px]">
        {SIN_SPECS.map((spec, i) => (
          <span key={spec} className="inline-flex items-center gap-3 whitespace-nowrap">
            {i > 0 && <span aria-hidden className="text-blood/60">/</span>}
            {spec}
          </span>
        ))}
      </div>
    </div>
  )
}
