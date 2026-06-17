"use client"

import { BUY_ANSWERS } from "@/content/bloodthirst-buy"
import { SectionHead, RULED_BG } from "./DocBits"

/**
 * Section 01 — intake questions. The three things every cold visitor asks,
 * laid out as a ruled Q&A ledger: question in the margin column, answer in
 * the body. No cards, no motion — the document just states things.
 */
export function Answers() {
  return (
    <section className="relative mx-auto w-full max-w-5xl px-5 py-16 md:px-10 md:py-24">
      <SectionHead no={BUY_ANSWERS.section} title={BUY_ANSWERS.title} />

      <dl style={RULED_BG}>
        {BUY_ANSWERS.items.map((item, i) => (
          <div
            key={item.q}
            className="grid gap-2 border-t border-bone/15 py-6 first:border-t-0 md:grid-cols-[11rem,1fr] md:gap-8 md:py-8"
          >
            <dt>
              <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-blood/90">
                Q.0{i + 1}
              </span>
              <span className="mt-1 block font-cinzel text-lg font-black uppercase leading-tight text-offwhite md:text-xl">
                {item.q}
              </span>
            </dt>
            <dd className="max-w-[36rem] text-sm leading-relaxed text-bone/68 md:pt-4 md:text-base">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
