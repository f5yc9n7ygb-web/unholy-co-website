import Reveal from "@/components/ux/Reveal"
import { TransitionLink } from "@/components/ux/TransitionLink"
import { HOME_RITUAL } from "@/content/home2026"

/**
 * FILE 03 — THE PROCESS. The 400vh pinned horizontal scroll-jack becomes a
 * scroll-snap rail: same horizontal storytelling, but the user drives it and
 * the page never hijacks the wheel. One markup path for mobile AND desktop —
 * card width is the only thing that responds. Pure CSS.
 */
export default function Ritual2026() {
  return (
    <section className="relative z-10 w-full py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <Reveal>
          <p className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.34em] text-blood/90 md:text-[10px]">
            <span aria-hidden className="h-px w-7 bg-blood/70" />
            {HOME_RITUAL.kicker}
          </p>
          <h2 className="mt-4 font-cinzel text-4xl font-black uppercase leading-[0.95] text-offwhite md:text-5xl lg:text-6xl">
            {HOME_RITUAL.title}
          </h2>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className="relative mt-10">
          {/* edge fades hint that the rail continues */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-24 bg-gradient-to-l from-[#060606] to-transparent md:block"
          />
          <div
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-10"
            role="list"
            aria-label="The ritual, step by step"
          >
            {HOME_RITUAL.steps.map((step) => (
              <article
                role="listitem"
                key={step.num}
                className="group relative w-[82%] shrink-0 snap-start overflow-hidden border border-bone/12 bg-[#0a0a0a] p-7 transition-colors duration-300 hover:border-blood/40 sm:w-[54%] md:w-[38%] md:p-10 lg:w-[32%]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-8 select-none font-cinzel text-[9rem] font-black leading-none text-offwhite/[0.03] md:text-[11rem]"
                >
                  {step.num}
                </span>

                <span className="relative z-10 inline-block border border-blood/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.3em] text-blood/90">
                  STEP {step.num}
                </span>

                <h3 className="relative z-10 mt-6 font-cinzel text-2xl font-bold uppercase tracking-[0.02em] text-offwhite md:text-3xl">
                  {step.title}
                </h3>

                <div className="relative z-10 mt-4 h-px w-14 bg-gradient-to-r from-blood/50 to-transparent" />

                <p className="relative z-10 mt-4 min-h-[7.5rem] text-[13px] leading-[1.6] text-bone/55 md:text-sm">
                  {step.desc}
                </p>
              </article>
            ))}

            {/* end card — continue the journey */}
            <div
              role="listitem"
              className="flex w-[70%] shrink-0 snap-start items-center justify-center border border-bone/12 bg-[#0a0a0a] p-7 sm:w-[44%] md:w-[28%]"
            >
              <div className="text-center">
                <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/45">
                  CONTINUE THE JOURNEY
                </p>
                <TransitionLink
                  href={HOME_RITUAL.ctaHref}
                  className="group inline-flex items-center justify-center gap-3 border border-blood bg-blood px-7 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-offwhite transition-colors duration-300 hover:bg-[#c4072a]"
                >
                  {HOME_RITUAL.cta}
                  <span
                    aria-hidden
                    className="inline-block h-px w-4 bg-offwhite/70 transition-all duration-300 group-hover:w-7"
                  />
                </TransitionLink>
                <TransitionLink
                  href={HOME_RITUAL.ctaGhostHref}
                  className="mt-4 block font-mono text-[9px] uppercase tracking-[0.28em] text-bone/50 underline-offset-4 transition-colors duration-300 hover:text-offwhite"
                >
                  {HOME_RITUAL.ctaGhost}
                </TransitionLink>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <p className="mx-auto mt-4 max-w-6xl px-5 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/35 md:px-10">
        ← drag through the ritual →
      </p>
    </section>
  )
}
