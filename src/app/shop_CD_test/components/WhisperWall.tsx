"use client"

import { motion } from "framer-motion"
import Image from "next/image"

/**
 * Beat 7 — the Whisper Wall.
 *
 * A masonry of use cases. Until real UGC is available, these are framed as
 * intended moments, not customer testimonials.
 *
 * When photos ship, swap the CaptionCard body for <Image /> with a polaroid
 * frame and the caption becomes a bottom-overlay.
 */

type Whisper = {
  city: string
  caption: string
  mood: "night" | "gym" | "desk" | "bar" | "hotel" | "ritual"
  initials: string
}

const WHISPERS: Whisper[] = [
  { city: "NIGHT SHIFT", caption: "cold hydration for edits, decks, sets, and deadlines that run past midnight.", mood: "night", initials: "01" },
  { city: "GYM BAG", caption: "zero sugar, 500ml, and a can that does not look like everyone else's bottle.", mood: "gym", initials: "02" },
  { city: "BAR KIT", caption: "premium still water that looks intentional on a table, console, or backstage crate.", mood: "bar", initials: "03" },
  { city: "HOTEL ROOM", caption: "mineral water for the morning after, the late check-in, and the blacked-out minibar.", mood: "hotel", initials: "04" },
  { city: "DESK WATER", caption: "a daily object with enough edge to stay on the desk instead of hiding in a drawer.", mood: "desk", initials: "05" },
  { city: "DROP TABLE", caption: "built for limited batches, event fridges, gifting crates, and after-dark rituals.", mood: "ritual", initials: "06" },
]

const moodStyle: Record<Whisper["mood"], string> = {
  night: "from-[#0a0a0f] to-[#1a0a14]",
  gym: "from-[#0a0a0a] to-[#150a10]",
  desk: "from-[#0c0c0c] to-[#141414]",
  bar: "from-[#0a0810] to-[#1c0a18]",
  hotel: "from-[#0c0a08] to-[#181208]",
  ritual: "from-[#08080a] to-[#18080c]",
}

export function WhisperWall() {
  return (
    <section className="relative overflow-hidden bg-black py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="mb-14 max-w-2xl md:mb-20"
        >
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.5em] text-blood/70 md:text-[11px]">
            // where it belongs
          </p>
          <h2 className="font-cinzel text-3xl font-black uppercase leading-[0.95] text-offwhite md:text-5xl">
            Built for<br />
            <span className="text-blood">after dark.</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {WHISPERS.map((w, i) => (
            <motion.div
              key={w.caption}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.7,
                delay: (i % 3) * 0.1 + Math.floor(i / 3) * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br ${moodStyle[w.mood]} p-6 transition-all duration-500 hover:border-blood/30 md:p-8 ${
                i === 1 ? "md:row-span-2" : ""
              }`}
            >
              {/* Top right — city */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blood/40 bg-blood/10 font-cinzel text-[10px] font-bold text-blood">
                  {w.initials}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/40">
                  {w.city}
                </span>
              </div>

              {/* Caption */}
              <p
                className="font-cinzel text-xl leading-snug text-offwhite/90 md:text-2xl"
                style={{ fontStyle: "italic", fontWeight: 400 }}
              >
                {w.caption}
              </p>

              {/* Tiny can */}
              <div className="mt-6 flex items-end justify-between">
                <div className="h-px w-10 bg-blood/40" />
                <Image
                  src="/can.webp"
                  alt=""
                  width={24}
                  height={42}
                  className="h-auto w-5 opacity-50 transition-opacity duration-500 group-hover:opacity-90 md:w-6"
                  aria-hidden="true"
                />
              </div>

              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(ellipse 400px 200px at 90% 10%, rgba(176,0,32,0.15), transparent 60%)",
                }}
              />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-bone/30 md:text-[11px]"
        >
          // real customer photos belong here once the first batch lands.
        </motion.p>
      </div>
    </section>
  )
}
