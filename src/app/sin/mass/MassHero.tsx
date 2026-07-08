"use client"

import { PACKS, getPackById } from "@/lib/shop/catalog"
import { SIN_AVAILABLE_PACK_IDS, SIN_ENTRY_PACK_ID } from "@/content/sin"
import { MASS_HERO } from "@/content/sin-mass"
import { HardButton, Halftone, Stamp } from "./theme"
import { MassDispatch } from "./MassDispatch"

/**
 * RED MASS hero — a kinetic poster, not a product shot. The can is sandwiched
 * INSIDE the stacked Anton headline (solid line / can / outlined line on top)
 * so type and object read as one collage. Price sticker + full-width CTA keep
 * the offer above the fold on a 390px phone; trust seam pins the fold's edge.
 *
 * Entrance is pure CSS (mass-slam / mass-pop with inline delays) — the fold
 * paints before hydration, no motion library.
 */
export function MassHero({ onBuy }: { onBuy: () => void }) {
  const entry = getPackById(SIN_ENTRY_PACK_ID) || PACKS[0]
  const available = PACKS.filter((p) =>
    SIN_AVAILABLE_PACK_IDS.includes(p.id as (typeof SIN_AVAILABLE_PACK_IDS)[number])
  )
  const floorPerCan = Math.min(...(available.length ? available : PACKS).map((p) => p.perCan))

  const slam = (delay: number) => ({
    animation: `mass-slam 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
  })

  return (
    <section
      id="sin-hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#050505] px-4 pb-4 pt-16 md:px-10 md:pb-6 md:pt-20"
    >
      {/* halftone field, upper left — texture, not lighting */}
      <Halftone className="left-[-8%] top-[6%] h-[42%] w-[70%] opacity-70 md:w-[44%]" />

      {/* ── Content — centered container so the can stays GLUED to the type
             column at any viewport width (the collage must never drift apart
             on wide screens). Can + hazard block are absolute within it. ── */}
      <div className="relative mx-auto flex w-full max-w-[80rem] flex-1 flex-col">
        {/* The can — sandwiched into the headline stack */}
        <img
          src="/bloodthirst-hero.webp"
          srcSet="/bloodthirst-hero-m.webp 720w, /bloodthirst-hero.webp 1100w"
          sizes="(max-width: 768px) 62vw, 38vw"
          alt="BloodThirst — matte-black 500ml can of natural mineral water"
          fetchPriority="high"
          decoding="async"
          className="absolute right-[-8%] top-[16%] z-[10] h-[54%] w-auto max-w-none object-contain sm:right-[-2%] md:left-auto md:right-[2%] md:top-[8%] md:h-[74%] lg:left-[31rem] lg:right-auto"
          style={slam(150)}
        />
        {/* hard red offset block behind the can — poster depth, not glow */}
        <div
          aria-hidden
          className="absolute right-[-14%] top-[22%] z-[5] h-[42%] w-[52%] border-2 border-blood sm:right-[-6%] md:left-auto md:right-[-2%] md:top-[14%] md:w-[24%] lg:left-[43rem] lg:right-auto"
          style={{ ...slam(80), background: "repeating-linear-gradient(-45deg, transparent 0 10px, rgba(176,0,32,0.22) 10px 20px)" }}
        />
        <div style={slam(0)}>
          <Stamp tone="blood" rotate={-2} pop>
            {MASS_HERO.stamp}
          </Stamp>
        </div>

        <h1 className="mt-4 font-anton uppercase leading-[0.9] tracking-[0.01em] md:mt-5 md:tracking-[0.03em]">
          <span
            className="relative z-[5] block text-[clamp(3.4rem,19vw,10.5rem)] text-offwhite"
            style={slam(60)}
          >
            {MASS_HERO.headline[0]}
          </span>
          {/* outlined line rides ON TOP of the can — the collage moment */}
          <span
            className="relative z-[20] block text-[clamp(3.4rem,19vw,10.5rem)] text-transparent"
            style={{
              ...slam(140),
              WebkitTextStroke: "2px #F6F6F6",
            }}
          >
            {MASS_HERO.headline[1]}
          </span>
          <span
            className="relative z-[5] block text-[clamp(3.4rem,19vw,10.5rem)] text-blood"
            style={slam(220)}
          >
            {MASS_HERO.headline[2]}
          </span>
        </h1>

        <p
          className="relative z-[20] mt-4 max-w-[19rem] font-mono text-[11px] font-bold uppercase leading-relaxed tracking-[0.14em] text-bone/75 sm:max-w-sm md:mt-5 md:text-xs"
          style={slam(300)}
        >
          {MASS_HERO.sub}
        </p>

        {/* ── Offer: sticker price + CTA slab ── */}
        <div className="relative z-[20] mt-6 md:mt-7" style={slam(380)}>
          <div className="flex flex-wrap items-center gap-4">
            <Stamp tone="paper" rotate={2} pop className="text-xs md:text-sm">
              {MASS_HERO.priceLabel} ₹{entry.price.toLocaleString("en-IN")} · {entry.qty} CANS
            </Stamp>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-bone/55">
              DOWN TO ₹{floorPerCan}/CAN BY THE CRATE
            </span>
          </div>

          <HardButton big onClick={onBuy} className="mt-4 w-full sm:w-auto sm:min-w-[22rem]">
            {MASS_HERO.cta}
            <span aria-hidden>→</span>
          </HardButton>

          <div className="mt-3">
            <MassDispatch />
          </div>
        </div>

        {/* ── Trust seam pinned to the fold ── */}
        <div className="relative z-[20] mt-auto pt-6" style={slam(460)}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t-2 border-offwhite/15 pt-3">
            {MASS_HERO.trust.map((t, i) => (
              <span key={t} className="flex items-center gap-4 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-bone/60">
                {i > 0 && (
                  <span aria-hidden className="text-blood">
                    ✕
                  </span>
                )}
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
