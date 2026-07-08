"use client"

import { SIN_VERSUS } from "@/content/sin"
import { SectionTitle } from "./marks"

/**
 * Can vs. plastic — short, confident comparison. Objection-killer with swagger.
 * sm+ keeps the three-column exhibit table; on phones each row stacks into a
 * verdict card (three cramped columns at 360px made the page's best argument
 * its least readable section).
 */
export function SinVersus({ onBuy }: { onBuy: () => void }) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-4xl px-5 py-20 md:px-10 md:py-28">
      <SectionTitle kicker={SIN_VERSUS.kicker} title={SIN_VERSUS.title} index="05" />

      {/* ── sm+: the table ── */}
      <div className="hidden border border-bone/15 bg-[#0b0b0b]/70 sm:block">
        {/* column heads */}
        <div className="grid grid-cols-[1fr_1.2fr_1.2fr] border-b border-bone/15 font-mono text-[9px] uppercase tracking-[0.26em] md:text-[10px]">
          <span className="px-4 py-3 text-bone/40" />
          <span className="border-l border-bone/12 px-4 py-3 text-blood">
            {SIN_VERSUS.usLabel}
          </span>
          <span className="border-l border-bone/12 bg-black/30 px-4 py-3 text-bone/40 line-through decoration-bone/30">
            {SIN_VERSUS.themLabel}
          </span>
        </div>

        {SIN_VERSUS.rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[1fr_1.2fr_1.2fr] text-sm ${
              i % 2 ? "bg-white/[0.015]" : ""
            }`}
          >
            <span className="px-4 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-bone/45">
              {row.label}
            </span>
            <span className="border-l border-bone/12 px-4 py-4 leading-snug text-offwhite/90">
              {row.us}
            </span>
            {/* the lesser option, rendered lesser: dimmed, desaturated, recessed */}
            <span className="border-l border-bone/12 bg-black/30 px-4 py-4 leading-snug text-bone/40 opacity-80 [filter:grayscale(1)]">
              {row.them}
            </span>
          </div>
        ))}
      </div>

      {/* ── phones: stacked verdict cards ── */}
      <div className="divide-y divide-bone/12 border border-bone/15 bg-[#0b0b0b]/70 sm:hidden">
        <div className="flex items-center gap-4 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.24em]">
          <span className="inline-flex items-center gap-2 text-blood">
            <span aria-hidden className="h-1 w-1 rounded-full bg-blood" />
            {SIN_VERSUS.usLabel}
          </span>
          <span className="inline-flex items-center gap-2 text-bone/40 line-through decoration-bone/30">
            <span aria-hidden className="h-1 w-1 rounded-full bg-bone/30" />
            {SIN_VERSUS.themLabel}
          </span>
        </div>
        {SIN_VERSUS.rows.map((row) => (
          <div key={row.label} className="px-4 py-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone/45">
              {row.label}
            </p>
            <p className="mt-2 flex gap-2.5 text-sm leading-snug text-offwhite/90">
              <span
                aria-hidden
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-blood"
              />
              {row.us}
            </p>
            <p className="mt-1.5 flex gap-2.5 text-[13px] leading-snug text-bone/40 [filter:grayscale(1)]">
              <span
                aria-hidden
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-bone/30"
              />
              {row.them}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 font-mono text-[9px] leading-relaxed tracking-[0.12em] text-bone/40">
        {SIN_VERSUS.footnote}
      </p>

      <div className="mt-9 flex justify-center">
        <button
          type="button"
          onClick={onBuy}
          className="group inline-flex items-center gap-3 border border-blood bg-blood px-9 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.34em] text-offwhite shadow-[0_18px_60px_-14px_rgba(176,0,32,0.65)] transition-colors duration-300 hover:bg-[#c4072a]"
        >
          <span>{SIN_VERSUS.cta}</span>
          <span aria-hidden className="inline-block h-px w-5 bg-offwhite/70 transition-all duration-300 group-hover:w-9" />
        </button>
      </div>
    </section>
  )
}
