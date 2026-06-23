"use client"

import type { Pack } from "@/lib/shop/catalog"
import { SIN_VALUE } from "@/content/sin"
import { SectionTitle } from "./marks"

/**
 * "Why ₹X a can" — three confident value props. The headline per-can figure is
 * derived live from the currently-selected pack, so the justification always
 * matches the price the buyer is looking at.
 */
export function SinValue({
  selected,
  onBuy,
}: {
  selected: Pack
  onBuy: () => void
}) {
  const title = SIN_VALUE.title.replace("%PER_CAN%", `₹${selected.perCan}`)

  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl px-5 py-20 md:px-10 md:py-28">
      <SectionTitle kicker={SIN_VALUE.kicker} title={title} />

      <div className="grid gap-px overflow-hidden border border-bone/12 bg-bone/12 md:grid-cols-3">
        {SIN_VALUE.items.map((item) => (
          <article
            key={item.tag}
            className="group flex flex-col gap-4 bg-[#0a0a0a] p-6 transition-colors duration-300 hover:bg-[#0e0e0e] md:p-8"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-blood/85">
              {item.tag}
            </span>
            <h3 className="font-cinzel text-xl font-black uppercase leading-[1.1] text-offwhite md:text-2xl">
              {item.head}
            </h3>
            <p className="text-sm leading-relaxed text-bone/62">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-9 flex justify-center">
        <button
          type="button"
          onClick={onBuy}
          className="group inline-flex items-center gap-3 border border-bone/25 bg-transparent px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.36em] text-offwhite transition-colors duration-300 hover:border-blood/70 hover:text-blood"
        >
          <span>Back to the cans</span>
          <span aria-hidden className="inline-block h-px w-6 bg-bone/45 transition-all duration-300 group-hover:w-10 group-hover:bg-blood" />
        </button>
      </div>
    </section>
  )
}
