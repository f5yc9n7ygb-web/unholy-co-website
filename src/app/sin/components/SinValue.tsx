"use client"

import type { Pack } from "@/lib/shop/catalog"
import { SIN_VALUE } from "@/content/sin"
import { SectionTitle } from "./marks"
import { Reveal } from "./Reveal"

/**
 * "Why ₹X a can" — the case file. The headline per-can figure is derived live
 * from the currently-selected pack, so the justification always matches the
 * price the buyer is looking at.
 *
 * md+: two-column autopsy layout — the specimen stays pinned (position:sticky,
 * pure CSS) while the three value exhibits scroll past it. Reuses the hero
 * render already in cache, so the extra product exposure costs zero bytes.
 * Mobile keeps the plain stacked cards (the hero + exhibit already showed the
 * can; scroll length is the scarcer resource there).
 */
export function SinValue({
  selected,
  onBuy,
}: {
  selected: Pack
  onBuy: () => void
}) {
  const title = SIN_VALUE.title.replace("%PER_CAN%", `₹${selected.perCan}`)

  return (
    <section className="relative z-10 mx-auto w-full max-w-5xl px-5 py-20 md:px-10 md:py-28">
      <SectionTitle kicker={SIN_VALUE.kicker} title={title} index="03" />

      <div className="md:grid md:grid-cols-[0.85fr_1.3fr] md:items-start md:gap-6">
        {/* pinned specimen — desktop only */}
        <figure className="sticky top-24 hidden overflow-hidden border border-bone/12 bg-[#0a0a0a] md:block">
          <div className="relative aspect-[3/4]">
            <img
              src="/bloodthirst-hero.webp"
              alt="BloodThirst can — the object under examination"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: "50% 40%", transform: "scale(1.15)" }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(7,7,7,0.9) 6%, transparent 40%), radial-gradient(90% 60% at 50% 30%, transparent 40%, rgba(0,0,0,0.45))",
              }}
            />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-3 p-5">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/55">
                THE OBJECT IN QUESTION
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-blood/85">
                ₹{selected.perCan}/CAN
              </span>
            </figcaption>
          </div>
        </figure>

        {/* the three exhibits */}
        <div className="grid gap-px overflow-hidden border border-bone/12 bg-bone/12">
          {SIN_VALUE.items.map((item, i) => (
            <Reveal key={item.tag} delay={i * 80}>
              <article className="group flex h-full flex-col gap-4 bg-[#0a0a0a] p-6 transition-colors duration-300 hover:bg-[#0e0e0e] md:p-8">
                <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-blood/85">
                  {item.tag}
                </span>
                <h3 className="font-cinzel text-xl font-black uppercase leading-[1.1] text-offwhite md:text-2xl">
                  {item.head}
                </h3>
                <p className="text-sm leading-relaxed text-bone/62">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-9 flex justify-center">
        <button
          type="button"
          onClick={onBuy}
          className="group inline-flex items-center gap-3 border border-bone/25 bg-transparent px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.36em] text-offwhite transition-colors duration-300 hover:border-blood/70 hover:text-blood"
        >
          <span>Back to the cans</span>
          <span aria-hidden className="inline-block h-px w-6 bg-bone/45 transition-all duration-300 group-hover:w-10 group-hover:bg-blood" />
        </button>
      </div>
    </section>
  )
}
