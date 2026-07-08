"use client"

import { MASS_VERSUS } from "@/content/sin-mass"
import { HardButton, Slam, SlabHead } from "./theme"

/**
 * CAN VS BOTTLE — the brutal split. Us = blood cell, them = washed-out paper
 * cell rendered clinical and sad. Stacked verdict pairs on mobile, a hard
 * two-column ledger on desktop. Claims + citations come straight from the
 * guardrail-approved copy (comparative microplastics, cited recycling claim).
 */
export function MassVersus({ onBuy }: { onBuy: () => void }) {
  return (
    <section id="sin-versus" className="relative bg-[#050505] px-4 py-16 md:px-10 md:py-24">
      <div className="mx-auto w-full max-w-4xl">
        <Slam>
          <SlabHead stamp={MASS_VERSUS.stamp} title={MASS_VERSUS.title} />
        </Slam>

        {/* column heads */}
        <Slam delay={40}>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <span className="border-2 border-offwhite bg-blood px-3 py-2 text-center font-anton text-lg uppercase tracking-[0.06em] text-offwhite md:text-xl">
              {MASS_VERSUS.usLabel}
            </span>
            <span className="border-2 border-offwhite/30 bg-offwhite/85 px-3 py-2 text-center font-anton text-lg uppercase tracking-[0.06em] text-[#050505]/60 line-through decoration-[3px] decoration-[#050505]/50 md:text-xl">
              {MASS_VERSUS.themLabel}
            </span>
          </div>
        </Slam>

        <div className="mt-3 space-y-3 md:mt-4 md:space-y-4">
          {MASS_VERSUS.rows.map((row, i) => (
            <Slam key={row.label} delay={60 + i * 60}>
              <div>
                <p className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-bone/50">
                  {row.label}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4">
                  <div className="flex items-start gap-3 border-2 border-blood bg-blood/[0.12] px-4 py-3.5">
                    <span aria-hidden className="mt-0.5 font-anton text-base leading-none text-blood">
                      ✓
                    </span>
                    <span className="font-mono text-xs font-bold uppercase leading-relaxed tracking-[0.08em] text-offwhite md:text-[13px]">
                      {row.us}
                    </span>
                  </div>
                  <div className="flex items-start gap-3 border-2 border-offwhite/20 bg-offwhite/[0.06] px-4 py-3.5 [filter:grayscale(1)]">
                    <span aria-hidden className="mt-0.5 font-anton text-base leading-none text-bone/60">
                      ✕
                    </span>
                    <span className="font-mono text-xs font-bold uppercase leading-relaxed tracking-[0.08em] text-bone/60 md:text-[13px]">
                      {row.them}
                    </span>
                  </div>
                </div>
              </div>
            </Slam>
          ))}
        </div>

        <p className="mt-5 font-mono text-[9px] leading-relaxed tracking-[0.1em] text-bone/40">
          {MASS_VERSUS.footnote}
        </p>

        <Slam delay={140}>
          <div className="mt-9 flex justify-center">
            <HardButton onClick={onBuy}>
              {MASS_VERSUS.cta}
              <span aria-hidden>→</span>
            </HardButton>
          </div>
        </Slam>
      </div>
    </section>
  )
}
