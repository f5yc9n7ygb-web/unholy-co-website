"use client"

import type { Pack } from "@/lib/shop/catalog"
import { MASS_WHY } from "@/content/sin-mass"
import { Slam, SlabHead } from "./theme"

/**
 * THE MATH — the price-justification slab. Sits immediately after the money
 * so the hesitator who scrolled past BUY NOW runs straight into the three
 * reasons the number is fair. Per-can figure derives live from the selected
 * pack, so the argument always matches the price on the button above it.
 */
export function MassWhy({ selected }: { selected: Pack }) {
  const title = MASS_WHY.title.replace("%PER_CAN%", `₹${selected.perCan}`)

  return (
    <section id="sin-why" className="relative bg-[#050505] px-4 py-16 md:px-10 md:py-24">
      <div className="mx-auto w-full max-w-4xl">
        <Slam>
          <SlabHead stamp={MASS_WHY.stamp} title={title} />
        </Slam>

        <div className="space-y-4">
          {MASS_WHY.items.map((item, i) => (
            <Slam key={item.n} delay={i * 80}>
              <article className="flex items-stretch border-2 border-offwhite/15 bg-[#0a0a0a]">
                <span
                  aria-hidden
                  className="flex w-16 shrink-0 items-center justify-center border-r-2 border-offwhite/15 font-anton text-3xl text-blood md:w-24 md:text-5xl"
                >
                  {item.n}
                </span>
                <div className="min-w-0 px-4 py-4 md:px-6 md:py-5">
                  <h3 className="font-anton text-xl uppercase leading-tight tracking-[0.03em] text-offwhite md:text-2xl">
                    {item.head}
                  </h3>
                  <p className="mt-2 font-mono text-xs leading-relaxed text-bone/70 md:text-[13px]">
                    {item.body}
                  </p>
                </div>
              </article>
            </Slam>
          ))}
        </div>
      </div>
    </section>
  )
}
