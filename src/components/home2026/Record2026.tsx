import Reveal from "@/components/ux/Reveal"
import { HOME_RECORD } from "@/content/home2026"

/**
 * FILE 01 — THE RECORD. The old glass-panel bento becomes an editorial spec
 * sheet: an asymmetric two-column grid with a hairline-ruled table of verified
 * water facts, closed by three lettered file entries. No glass, no tilt, no
 * text-scramble — the 2026 read is paper-ledger-on-black.
 */
export default function Record2026() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <div className="grid gap-10 md:grid-cols-[5fr,7fr] md:gap-16">
        {/* ── Left: file heading + intro ── */}
        <div>
          <Reveal>
            <p className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.34em] text-blood/90 md:text-[10px]">
              <span aria-hidden className="h-px w-7 bg-blood/70" />
              {HOME_RECORD.kicker}
            </p>
            <h2 className="mt-4 font-cinzel text-4xl font-black uppercase leading-[0.95] text-offwhite md:text-5xl lg:text-6xl">
              {HOME_RECORD.title}
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md border-l-2 border-blood/60 pl-4 text-[13px] leading-[1.6] text-bone/65 md:text-sm">
              {HOME_RECORD.intro}
            </p>
          </Reveal>
        </div>

        {/* ── Right: the spec table ── */}
        <Reveal delay={0.1}>
          <dl className="border-t border-bone/15">
            {HOME_RECORD.specs.map((spec) => (
              <div
                key={spec.label}
                className="group flex items-baseline justify-between gap-6 border-b border-bone/10 py-3.5 transition-colors duration-300 hover:border-blood/40 md:py-4"
              >
                {/* labels are pre-uppercased in content so "pH" can keep its
                    chemical casing — no uppercase transform here */}
                <dt className="font-mono text-[9px] tracking-[0.28em] text-bone/60 md:text-[10px]">
                  {spec.label}
                </dt>
                <dd className="text-right font-cinzel text-sm font-bold tabular-nums tracking-[0.04em] text-offwhite md:text-base">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      {/* ── The three file entries ── */}
      <div className="mt-16 grid gap-x-8 gap-y-10 md:mt-24 md:grid-cols-3">
        {HOME_RECORD.entries.map((entry, i) => (
          <Reveal key={entry.num} delay={i * 0.12}>
            <article className="border-t border-bone/15 pt-5">
              <p className="flex items-baseline justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blood/80">
                  EXHIBIT {entry.num}
                </span>
                <span aria-hidden className="font-cinzel text-3xl font-black leading-none text-offwhite/[0.07] md:text-4xl">
                  {entry.num}
                </span>
              </p>
              <h3 className="mt-3 font-cinzel text-lg font-bold uppercase tracking-[0.04em] text-offwhite md:text-xl">
                {entry.title}
              </h3>
              <p className="mt-3 text-[13px] leading-[1.6] text-bone/55 md:text-sm">
                {entry.desc}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
