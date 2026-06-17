"use client"

import { BUY_FAQ } from "@/content/bloodthirst-buy"
import { SectionHead } from "./DocBits"

/**
 * Section 05 — interrogation. Native <details>/<summary>: keyboard-accessible,
 * zero JS, styled as numbered questions in the transcript.
 */
export function Faq() {
  return (
    <section className="relative mx-auto w-full max-w-3xl px-5 py-16 md:py-24">
      <SectionHead no={BUY_FAQ.section} title={BUY_FAQ.title} />

      <div className="border-t border-bone/15">
        {BUY_FAQ.items.map((item, i) => (
          <details key={item.q} className="group border-b border-bone/15">
            <summary className="flex cursor-pointer list-none items-baseline gap-4 py-5 [&::-webkit-details-marker]:hidden">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blood/90">
                Q.0{i + 1}
              </span>
              <span className="flex-1 font-cinzel text-base font-bold uppercase tracking-[0.04em] text-offwhite/90 transition-colors group-hover:text-offwhite">
                {item.q}
              </span>
              <span
                aria-hidden
                className="shrink-0 font-mono text-lg leading-none text-blood transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-5 pl-11 text-sm leading-relaxed text-bone/68 md:pl-14">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
