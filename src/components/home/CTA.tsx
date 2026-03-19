import { Marquee } from "@/components/ux/Marquee"
import { SplitTextReveal } from "@/components/ux/SplitTextReveal"
import Reveal from "@/components/ux/Reveal"
import { SubscribeForm } from "@/components/forms/SubscribeForm"

export default function HomeCTA() {
  return (
    <section
      id="subscribe"
      className="relative overflow-hidden scroll-mt-28 py-32 md:py-40"
    >
      <div className="absolute inset-x-0 bottom-0 h-[400px] bg-gradient-to-t from-blood/[0.06] to-transparent pointer-events-none" />

      <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none">
        <div className="w-full opacity-[0.025]">
          <Marquee speed={80} pauseOnHover={false}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="mx-[4vw] shrink-0 whitespace-nowrap font-cinzel text-[15vw] font-black leading-none text-offwhite md:text-[12vw]"
              >
                STAY UNHOLY
              </span>
            ))}
          </Marquee>
        </div>
      </div>

      <div className="container relative z-10 mx-auto max-w-2xl px-4 text-center">
        <Reveal>
          <p className="mb-6 text-[10px] uppercase tracking-[0.4em] text-bone/40 md:text-xs">
            Join the Cult
          </p>
        </Reveal>

        <SplitTextReveal
          text="STAY UNHOLY"
          as="h2"
          className="font-cinzel text-3xl font-bold text-offwhite md:text-5xl lg:text-6xl"
          stagger={0.04}
        />

        <Reveal delay={0.2}>
          <p className="mx-auto mt-4 mb-10 max-w-md text-sm leading-relaxed text-bone/50 md:text-base">
            First access to drops, rituals, and everything we don&apos;t tell
            the ordinary.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mx-auto max-w-md">
            <SubscribeForm
              source="homepage-v2"
              buttonLabel="Stay Unholy"
              formClassName="flex flex-col gap-3 sm:flex-row"
              inputClassName="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3.5 text-sm text-offwhite placeholder:text-bone/30 outline-none backdrop-blur-sm transition-colors hover:bg-white/[0.06] focus:border-blood/50 focus:ring-1 focus:ring-blood/30"
              buttonClassName="btn btn-primary w-full px-8 sm:w-auto"
              statusClassName="text-sm text-offwhite/70"
            />
          </div>
        </Reveal>

        <Reveal delay={0.5}>
          <div className="mx-auto mt-16 h-px w-10 bg-blood/30" />
        </Reveal>
      </div>
    </section>
  )
}
