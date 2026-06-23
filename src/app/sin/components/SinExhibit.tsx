"use client"

import { SIN_EXHIBIT } from "@/content/sin"
import { SectionTitle } from "./marks"
import { Reveal } from "./Reveal"

/**
 * The Exhibit — product gallery. Cold buyers need to SEE the thing; the old
 * page only used the can as a cropped backdrop. Each frame is a treated crop of
 * a real asset (the can render + the unwrapped label art) via object-position +
 * scale, so genuine product photography drops in later by editing SIN_EXHIBIT.
 *
 * Horizontal scroll-snap rail on mobile (big swipeable frames), a 4-up grid on
 * desktop. Pure CSS — no carousel library, no JS.
 */
export function SinExhibit() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <Reveal>
        <SectionTitle kicker={SIN_EXHIBIT.kicker} title={SIN_EXHIBIT.title} />
      </Reveal>
      <Reveal delay={60}>
        <p className="-mt-6 mb-9 max-w-2xl text-sm leading-relaxed text-bone/60 md:text-base">
          {SIN_EXHIBIT.subtitle}
        </p>
      </Reveal>

      <Reveal delay={100}>
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-3 md:overflow-visible"
          role="list"
          aria-label="Product gallery"
        >
          {SIN_EXHIBIT.shots.map((shot) => (
            <figure
              role="listitem"
              key={shot.cap}
              className="group relative aspect-[3/4] w-[76%] shrink-0 snap-start overflow-hidden border border-bone/12 bg-[#0a0a0a] sm:w-[44%] md:w-auto"
            >
              <img
                src={shot.src}
                alt={`${shot.cap} — ${shot.note}`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                style={{
                  objectPosition: shot.pos,
                  transform: `scale(${shot.scale})`,
                  transformOrigin: shot.pos,
                }}
              />
              {/* legibility gradient for the caption */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(7,7,7,0.92) 4%, rgba(7,7,7,0.35) 34%, transparent 60%)",
                }}
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <span className="block font-cinzel text-sm font-black uppercase tracking-[0.06em] text-offwhite md:text-base">
                  {shot.cap}
                </span>
                <span className="mt-1 block font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-bone/55">
                  {shot.note}
                </span>
              </figcaption>
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-blood/0 transition-colors duration-300 group-hover:border-blood/70"
              />
            </figure>
          ))}
        </div>
      </Reveal>

      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/35 md:hidden">
        ← swipe the evidence →
      </p>
    </section>
  )
}
