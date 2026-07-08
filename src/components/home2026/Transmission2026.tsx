import Reveal from "@/components/ux/Reveal"
import { SplitTextReveal } from "@/components/ux/SplitTextReveal"
import { SubscribeForm } from "@/components/forms/SubscribeForm"
import { HOME_TRANSMISSION } from "@/content/home2026"

/**
 * The close — sober near the conversion, per the "foundation & tower" rule.
 * The old CTA ran a second marquee behind the form; 2026 replaces it with one
 * static ghost wordmark and a verified-claims seam above the footer.
 */
export default function Transmission2026() {
  return (
    <section id="subscribe" className="relative z-10 overflow-hidden scroll-mt-28 py-28 md:py-40">
      {/* single static ghost wordmark — no marquee this close to the form */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <span className="whitespace-nowrap font-cinzel text-[18vw] font-black uppercase leading-none text-offwhite/[0.025] md:text-[13vw]">
          {HOME_TRANSMISSION.title}
        </span>
      </div>

      <div className="container relative z-10 mx-auto max-w-2xl px-4 text-center">
        <Reveal>
          <p className="mb-6 flex items-center justify-center gap-4 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45 md:text-[10px]">
            <span aria-hidden className="h-px w-8 bg-blood/70" />
            {HOME_TRANSMISSION.kicker}
            <span aria-hidden className="h-px w-8 bg-blood/70" />
          </p>
        </Reveal>

        <SplitTextReveal
          text={HOME_TRANSMISSION.title}
          as="h2"
          className="font-cinzel text-3xl font-black uppercase text-offwhite md:text-5xl lg:text-6xl"
          stagger={0.04}
        />

        <Reveal delay={0.2}>
          <p className="mx-auto mt-4 mb-10 max-w-md text-[13px] leading-relaxed text-bone/55 md:text-base">
            {HOME_TRANSMISSION.copy}
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mx-auto max-w-md">
            <SubscribeForm
              source="homepage-2026"
              buttonLabel="Stay Unholy"
              formClassName="flex flex-col gap-3 sm:flex-row"
              inputClassName="flex-1 border border-bone/15 bg-black/45 px-5 py-3.5 text-sm text-offwhite placeholder:text-bone/30 outline-none transition-colors hover:border-bone/25 focus:border-blood/60 focus:ring-1 focus:ring-blood/30"
              buttonClassName="inline-flex items-center justify-center border border-blood bg-blood px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.28em] text-offwhite transition-colors duration-300 hover:bg-[#c4072a] w-full sm:w-auto"
              statusClassName="text-sm text-offwhite/70"
            />
          </div>
        </Reveal>

        {/* verified seam — the receipts, right where the page ends */}
        <Reveal delay={0.45}>
          <div className="mx-auto mt-16 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-bone/15 pt-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blood/90">
              VERIFIED:
            </span>
            {HOME_TRANSMISSION.verified.map((t) => (
              <span key={t} className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone/55">
                {t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
