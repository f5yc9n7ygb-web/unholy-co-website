"use client"

import { PROOF_LINES } from "@/content/bloodthirst"
import { BUY_STREET } from "@/content/bloodthirst-buy"
import { SectionHead, RULED_BG } from "./DocBits"

/** Section 04 — witness statements. Quotes as numbered log entries, not cards. */
const STATEMENTS = PROOF_LINES.slice(0, 4)

export function Street() {
  return (
    <section className="relative mx-auto w-full max-w-5xl px-5 py-16 md:px-10 md:py-24">
      <SectionHead no={BUY_STREET.section} title={BUY_STREET.title} />

      <div style={RULED_BG}>
        {STATEMENTS.map((s, i) => (
          <figure
            key={s.quote}
            className="grid gap-1 border-t border-bone/15 py-6 first:border-t-0 md:grid-cols-[11rem,1fr] md:gap-8"
          >
            <figcaption className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/55">
              <span className="block text-blood/90">W-0{i + 1}</span>
              <span className="mt-1 block">{s.attr.replace(/^—\s*/, "")}</span>
            </figcaption>
            <blockquote className="max-w-[34rem] font-cinzel text-lg font-bold leading-snug text-offwhite/90 md:text-2xl">
              “{s.quote}”
            </blockquote>
          </figure>
        ))}
      </div>
    </section>
  )
}
