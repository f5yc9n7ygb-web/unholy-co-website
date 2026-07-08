import Reveal from "@/components/ux/Reveal"
import { HOME_GALLERY } from "@/content/home2026"

/**
 * FILE 02 — THE EVIDENCE. Real photography instead of CSS glow: treated crops
 * of actual assets in a scroll-snap rail on mobile / 4-up grid on desktop
 * (same proven pattern as /sin's exhibit). Pure CSS, no carousel library.
 * Swap in fresh photography by editing HOME_GALLERY.
 */
export default function Gallery2026() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 md:px-10 md:py-28">
      <Reveal>
        <p className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.34em] text-blood/90 md:text-[10px]">
          <span aria-hidden className="h-px w-7 bg-blood/70" />
          {HOME_GALLERY.kicker}
        </p>
        <h2 className="mt-4 font-cinzel text-4xl font-black uppercase leading-[0.95] text-offwhite md:text-5xl lg:text-6xl">
          {HOME_GALLERY.title}
        </h2>
      </Reveal>

      <Reveal delay={0.12}>
        <div
          className="mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:overflow-visible"
          role="list"
          aria-label="Product photography"
        >
          {HOME_GALLERY.shots.map((shot, i) => (
            <figure
              role="listitem"
              key={shot.cap}
              className="group relative aspect-[3/4] w-[82%] shrink-0 snap-start overflow-hidden border border-bone/12 bg-[#0a0a0a] sm:w-[44%] md:w-auto"
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
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(6,6,6,0.92) 4%, rgba(6,6,6,0.35) 34%, transparent 60%)",
                }}
              />
              <span
                aria-hidden
                className="absolute left-3 top-3 border border-bone/20 bg-black/50 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.24em] text-bone/55 backdrop-blur-sm"
              >
                {String(i + 1).padStart(2, "0")}/{String(HOME_GALLERY.shots.length).padStart(2, "0")}
              </span>
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
