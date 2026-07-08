"use client"

import { SIN_FAQ } from "@/content/sin"
import { SectionTitle } from "./marks"

/**
 * FAQ — objection killers. Native <details> so it's keyboard-accessible and
 * needs zero JS (no accordion library, no motion cost).
 */
export function SinFaq() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-3xl px-5 py-20 md:px-10 md:py-28">
      <SectionTitle kicker={SIN_FAQ.kicker} title={SIN_FAQ.title} index="06" />

      <div className="divide-y divide-bone/12 border-y border-bone/12">
        {SIN_FAQ.items.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-cinzel text-base font-bold uppercase tracking-[0.02em] text-offwhite/90 transition-colors hover:text-offwhite md:text-lg">
              <span>{item.q}</span>
              <span
                aria-hidden
                className="font-mono text-lg leading-none text-blood transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-6 text-sm leading-relaxed text-bone/62">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
