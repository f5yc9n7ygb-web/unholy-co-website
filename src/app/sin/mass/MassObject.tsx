"use client"

import { MASS_OBJECT } from "@/content/sin-mass"
import { Halftone, Slam, SlabHead, Stamp } from "./theme"

/**
 * THE OBJECT — product slab. Photo blocks in hard offwhite frames with red
 * offset shadows (poster prints pinned to a black wall), swipeable snap rail
 * on mobile / 4-up grid on desktop. Under it, three giant stat numerals do
 * the spec-sheet work the old page gave to a quiet seam.
 */
export function MassObject() {
  return (
    <section id="sin-object" className="relative overflow-hidden bg-[#050505] px-4 py-16 md:px-10 md:py-24">
      <Halftone className="right-[-6%] top-[-4%] h-[36%] w-[44%] opacity-50" />

      <div className="relative mx-auto w-full max-w-6xl">
        <Slam>
          <SlabHead stamp={MASS_OBJECT.stamp} title={MASS_OBJECT.title} sub={MASS_OBJECT.sub} />
        </Slam>

        <Slam delay={80}>
          <div
            role="list"
            aria-label="Product gallery"
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-6 md:overflow-visible"
          >
            {MASS_OBJECT.shots.map((shot, i) => (
              <figure
                role="listitem"
                key={shot.cap}
                className="group relative w-[80%] shrink-0 snap-start border-2 border-offwhite bg-[#0a0a0a] shadow-[8px_8px_0_#B00020] sm:w-[46%] md:w-auto"
                style={{ transform: `rotate(${i % 2 ? 0.6 : -0.6}deg)` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={shot.src}
                    alt={`${shot.cap} — ${shot.note}`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    style={{
                      objectPosition: shot.pos,
                      transform: `scale(${shot.scale})`,
                      transformOrigin: shot.pos,
                    }}
                  />
                </div>
                <figcaption className="flex items-baseline justify-between gap-2 border-t-2 border-offwhite bg-[#050505] px-3 py-2.5">
                  <span className="font-anton text-base uppercase tracking-[0.06em] text-offwhite">
                    {shot.cap}
                  </span>
                  <span className="truncate font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-bone/55">
                    {shot.note}
                  </span>
                </figcaption>
                <span className="absolute -left-2 -top-3">
                  <Stamp tone="blood" rotate={i % 2 ? 3 : -3} className="px-2 py-1 text-[9px]">
                    {String(i + 1).padStart(2, "0")}
                  </Stamp>
                </span>
              </figure>
            ))}
          </div>
          <p className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-bone/40 md:hidden">
            ← SWIPE →
          </p>
        </Slam>

        {/* giant stat numerals */}
        <div className="mt-12 grid grid-cols-1 gap-px border-2 border-offwhite/20 bg-offwhite/20 sm:grid-cols-3 md:mt-16">
          {MASS_OBJECT.stats.map((stat, i) => (
            <Slam key={stat.small} delay={i * 90} className="bg-[#050505]">
              <div className="px-6 py-7 md:px-8 md:py-9">
                <span className="block font-anton text-6xl uppercase leading-none text-blood md:text-7xl">
                  {stat.big}
                </span>
                <span className="mt-2 block font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-bone/65">
                  {stat.small}
                </span>
              </div>
            </Slam>
          ))}
        </div>
      </div>
    </section>
  )
}
