"use client"

import { MASS_FAQ } from "@/content/sin-mass"
import { Slam, SlabHead } from "./theme"

/**
 * ASK. WE DARE YOU. — objection killers as a giant accordion. Native
 * <details>, zero JS; Anton questions with an oversized red cross that
 * rotates open. Answers stay in verified-fact voice.
 */
export function MassFaq() {
  return (
    <section id="sin-faq" className="relative bg-[#050505] px-4 pb-8 pt-16 md:px-10 md:pb-14 md:pt-24">
      <div className="mx-auto w-full max-w-3xl">
        <Slam>
          <SlabHead stamp={MASS_FAQ.stamp} title={MASS_FAQ.title} />
        </Slam>

        <div className="divide-y-2 divide-offwhite/12 border-y-2 border-offwhite/12">
          {MASS_FAQ.items.map((item, i) => (
            <Slam key={item.q} delay={i * 50}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offwhite [&::-webkit-details-marker]:hidden">
                  <span className="font-anton text-xl uppercase leading-tight tracking-[0.03em] text-offwhite transition-colors group-hover:text-blood md:text-2xl">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 font-anton text-3xl leading-none text-blood transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 font-mono text-xs leading-relaxed text-bone/75 md:text-[13px]">
                  {item.a}
                </p>
              </details>
            </Slam>
          ))}
        </div>
      </div>
    </section>
  )
}
