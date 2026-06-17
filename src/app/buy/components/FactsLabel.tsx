"use client"

import { DAMNATION_FACTS } from "@/content/bloodthirst"
import { BUY_COLLECTIBLE } from "@/content/bloodthirst-buy"
import { Barcode, Stamp } from "./DocBits"

/**
 * Damnation Facts — the nutrition-label parody, the page's conceptual anchor.
 * The label is the one element that keeps a hard border: it's a label.
 * Now stamped and barcoded like the rest of the file.
 */
export function FactsLabel() {
  return (
    <section className="relative mx-auto w-full max-w-2xl px-5 py-16 md:py-24">
      <div className="relative border-2 border-bone/30 bg-[#0c0c0c] p-6 md:p-8">
        <div className="absolute -right-3 -top-4">
          <Stamp rotate={9}>BATCH 001</Stamp>
        </div>

        <h2 className="border-b-4 border-bone/25 pb-2 font-cinzel text-2xl font-black uppercase tracking-[0.08em] text-offwhite md:text-3xl">
          {DAMNATION_FACTS.title}
        </h2>
        <p className="border-b border-bone/20 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/55">
          {DAMNATION_FACTS.serving}
        </p>
        <dl>
          {DAMNATION_FACTS.rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 border-b border-bone/15 py-2.5"
            >
              <dt className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-bone/72">
                {row.label}
              </dt>
              <dd className="text-right font-mono text-xs text-offwhite/85">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
          <p className="max-w-[18rem] text-xs leading-relaxed text-bone/45">
            {DAMNATION_FACTS.footer}
          </p>
          <Barcode />
        </div>
      </div>

      {/* collectible framing — true scarcity, no countdown theatre */}
      <p className="mx-auto mt-8 max-w-md text-center font-cinzel text-base font-bold uppercase leading-relaxed tracking-[0.06em] text-blood md:text-lg">
        {BUY_COLLECTIBLE.note}
      </p>
    </section>
  )
}
