"use client"

import { BUY_VERSUS } from "@/content/bloodthirst-buy"
import { SectionHead, Stamp } from "./DocBits"

/**
 * Section 03 — comparative findings. The price objection met as an exhibit:
 * ruled two-column table, our column in ink, theirs fading like a bad
 * photocopy. EXHIBIT A stamp overlaps the table corner.
 */
export function Versus({ onBuy }: { onBuy: () => void }) {
  return (
    <section className="relative mx-auto w-full max-w-5xl px-5 py-16 md:px-10 md:py-24">
      <SectionHead no={BUY_VERSUS.section} title={BUY_VERSUS.title} />

      <p className="font-cinzel text-[clamp(1.6rem,5vw,2.8rem)] font-black uppercase leading-tight text-offwhite">
        {BUY_VERSUS.question}
      </p>
      <p className="mt-2 max-w-xl text-base leading-relaxed text-bone/68 md:text-lg">
        {BUY_VERSUS.answer}
      </p>

      <div className="relative mt-10">
        {/* exhibit stamp — breaks the table's containment */}
        <div className="absolute -top-4 right-2 z-10 md:-right-4">
          <Stamp rotate={6}>{BUY_VERSUS.stamp}</Stamp>
        </div>

        <table className="w-full border-t-2 border-bone/30 text-left">
          <thead>
            <tr className="border-b border-bone/20">
              <th scope="col" className="sr-only">
                Criterion
              </th>
              <th
                scope="col"
                className="py-3 pr-4 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-blood"
              >
                {BUY_VERSUS.usLabel}
              </th>
              <th
                scope="col"
                className="py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-bone/45"
              >
                {BUY_VERSUS.themLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {BUY_VERSUS.rows.map((row) => (
              <tr key={row.label} className="border-b border-bone/15 align-top">
                <th
                  scope="row"
                  className="w-0 py-4 pr-4 font-mono text-[9px] font-normal uppercase tracking-[0.3em] text-bone/55 md:w-32"
                >
                  {row.label}
                </th>
                <td className="py-4 pr-4 text-sm leading-relaxed text-offwhite/88">
                  {row.us}
                </td>
                <td className="py-4 text-sm leading-relaxed text-bone/42">
                  {row.them}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/45">
        {BUY_VERSUS.footnote}
      </p>

      <div className="mt-10">
        <a
          href="#bt-buy"
          onClick={onBuy}
          className="inline-flex items-center gap-3 border border-blood bg-blood px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-offwhite transition-colors duration-300 hover:bg-blood/85"
        >
          {BUY_VERSUS.cta}
          <span aria-hidden className="inline-block h-px w-5 bg-offwhite/70" />
        </a>
      </div>
    </section>
  )
}
