"use client"

import Image from "next/image"
import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Reveal from "@/components/ux/Reveal"
import { TransitionLink } from "@/components/ux/TransitionLink"
import { CountUp } from "@/components/ux/CountUp"

/* ─── Sub-components ─── */

function TimelineNode({
  act,
  title,
  description,
  side,
}: {
  act: string
  title: string
  description: string
  side: "left" | "right"
}) {
  return (
    <div className="relative md:grid md:grid-cols-2 md:gap-12">
      {/* Dot on the center line (desktop) */}
      <div className="absolute left-1/2 top-1 hidden h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-blood/40 bg-blood/20 md:block" />

      {side === "left" ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="md:pr-12 md:text-right"
          >
            <span className="font-cinzel text-[10px] uppercase tracking-[0.4em] text-blood/60">
              {act}
            </span>
            <h3 className="mt-2 font-cinzel text-xl font-bold text-offwhite md:text-2xl">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-bone/50 md:text-base">
              {description}
            </p>
          </motion.div>
          <div className="hidden md:block" />
        </>
      ) : (
        <>
          <div className="hidden md:block" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="md:pl-12"
          >
            <span className="font-cinzel text-[10px] uppercase tracking-[0.4em] text-blood/60">
              {act}
            </span>
            <h3 className="mt-2 font-cinzel text-xl font-bold text-offwhite md:text-2xl">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-bone/50 md:text-base">
              {description}
            </p>
          </motion.div>
        </>
      )}
    </div>
  )
}

/* ─── Data ─── */

const tastingNotes = [
  {
    act: "Act I",
    title: "Opening Hit",
    description:
      "Bright mineral snap — a cold slap of alpine clarity that wakes the palate like a midnight siren.",
    side: "left" as const,
  },
  {
    act: "Act II",
    title: "Mid-Palate",
    description:
      "Smooth bicarbonate body, ghost of calcium sweetness. Himalayan mineral clarity keeps things razor clean.",
    side: "right" as const,
  },
  {
    act: "Act III",
    title: "Finale",
    description:
      "Clean, dry exit — zero aftertaste, full reset. Noble finish that lingers just long enough to remind you you're alive.",
    side: "left" as const,
  },
]

const specs = [
  { value: "500", unit: "ml", label: "Format" },
  { value: "11,000", unit: "ft", label: "Elevation" },
  { value: "4", unit: "minerals", label: "Profile" },
  { value: "0", unit: "% plastic", label: "Packaging" },
]

const minerals = [
  {
    symbol: "Ca",
    name: "Calcium",
    desc: "Bone density, nerve function, the thing your body handles quietly while you're busy overthinking everything else.",
  },
  {
    symbol: "Mg",
    name: "Magnesium",
    desc: "Muscle recovery, stress regulation. Nature's off switch — the one that actually works.",
  },
  {
    symbol: "K",
    name: "Potassium",
    desc: "Electrolyte balance, blood pressure. The reason your body doesn't stage a full revolt after the third encore.",
  },
  {
    symbol: "HCO₃",
    name: "Bicarbonates",
    desc: "Natural alkalinity. Clean, smooth finish — mineral water's signature without the wellness lecture.",
  },
]

/* ─── Main Component ─── */

export function BloodThirstClient() {
  /* Section 1: Cinematic Opener — scroll-driven */
  const openerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: openerRef,
    offset: ["start start", "end start"],
  })

  /* Letterbox bars shrink 15vh → 0 */
  const barHeight = useTransform(scrollYProgress, [0, 0.5], ["15vh", "0vh"])

  /* Can scales up, fades in */
  const canScale = useTransform(scrollYProgress, [0, 0.5], [0.85, 1])
  const canOpacity = useTransform(scrollYProgress, [0, 0.3], [0.6, 1])

  /* Title drifts up */
  const titleY = useTransform(scrollYProgress, [0, 0.5], [16, 0])

  /* Tagline fades in after bars start receding */
  const taglineOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1])

  return (
    <>
      {/* ═══ Section 1: CINEMATIC OPENER ═══ */}
      <section ref={openerRef} className="relative h-[150vh]">
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
          {/* Subtle static radial gradient — NOT animated orbs */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(176,0,32,0.06)_0%,transparent_70%)]" />

          {/* Letterbox bar — top */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-black"
            style={{ height: barHeight }}
          />
          {/* Letterbox bar — bottom */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-black"
            style={{ height: barHeight }}
          />

          {/* Can — static centered, scales on scroll */}
          <motion.div
            className="relative z-10"
            style={{ scale: canScale, opacity: canOpacity }}
          >
            <Image
              src="/can.png"
              alt="BLOODTHIRST by UNHOLY CO."
              width={200}
              height={360}
              priority
              className="drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            />
          </motion.div>

          {/* Title block — below can */}
          <motion.div
            className="relative z-20 mt-8 text-center px-4"
            style={{ y: titleY }}
          >
            <p className="text-[9px] uppercase tracking-[0.5em] text-bone/25 mb-3 md:text-[10px]">
              UNHOLY CO.
            </p>
            <h1 className="font-cinzel text-4xl font-bold uppercase tracking-[0.12em] text-offwhite md:text-5xl lg:text-6xl">
              BloodThirst
            </h1>
            <motion.p
              className="mt-4 text-[10px] md:text-xs uppercase tracking-[0.3em] text-bone/40"
              style={{ opacity: taglineOpacity }}
            >
              Natural mineral water armored in obsidian-black aluminum
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ═══ Section 2: STICKY PRODUCT + SCROLLING EDITORIAL ═══ */}
      <section className="relative py-24 md:py-0">
        <div className="mx-auto max-w-6xl px-4">
          {/* Mobile: can shown once above text */}
          <div className="mb-16 flex justify-center md:hidden">
            <Image
              src="/can.png"
              alt="BloodThirst can"
              width={140}
              height={260}
              className="drop-shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
            />
          </div>

          <div className="md:grid md:grid-cols-2 md:gap-16">
            {/* Left: Sticky can (desktop only) */}
            <div className="hidden md:block">
              <div className="sticky top-0 flex h-screen items-center justify-center">
                {/* Thin blood thread line behind can */}
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-blood/20 to-transparent" />
                <Image
                  src="/can.png"
                  alt="BloodThirst can"
                  width={180}
                  height={340}
                  className="relative z-10 drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                />
              </div>
            </div>

            {/* Right: Scrolling editorial blocks */}
            <div className="space-y-32 md:space-y-48 md:py-[30vh]">
              <Reveal>
                <div>
                  <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-blood/60">
                    The Elixir
                  </p>
                  <p className="text-lg leading-relaxed text-bone/60 md:text-xl">
                    BloodThirst is not just water. It never claimed to be. Natural mineral
                    water from Himalayan volcanic geology at 11,000 feet — sealed in matte
                    obsidian-black aluminum, because the contents finally warrant the
                    packaging. Every sip is deliberate. Unapologetic. Hydration with a point
                    of view.
                  </p>
                </div>
              </Reveal>

              <Reveal>
                <div>
                  <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-blood/60">
                    The Source
                  </p>
                  <p className="text-lg leading-relaxed text-bone/60 md:text-xl">
                    The Himalayas took 50 million years to form. The water had time to get
                    interesting — filtered through ancient volcanic rock, picking up calcium,
                    magnesium, potassium, and bicarbonates along the way.
                    Nature&apos;s own mineral formula. We put it in a can. You&apos;re
                    welcome.
                  </p>
                </div>
              </Reveal>

              <Reveal>
                <div>
                  <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-blood/60">
                    The Stand
                  </p>
                  <p className="text-lg leading-relaxed text-bone/60 md:text-xl">
                    Zero plastic, because the planet has enough problems. Zero compromise,
                    because frankly so do you. Sealed in recycled aluminum for backstage
                    riders, midnight creatives, and everyone who quietly decided that
                    &apos;whatever&apos;s in the fridge&apos; stopped being enough.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 3: TASTING NOTES — Vertical Timeline ═══ */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-4">
          <Reveal>
            <div className="text-center">
              <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-bone/40">
                Taste Profile
              </p>
              <h2 className="font-cinzel text-3xl font-bold text-offwhite md:text-4xl lg:text-5xl">
                Three acts of clarity
              </h2>
            </div>
          </Reveal>

          {/* Timeline container */}
          <div className="relative mt-16 md:mt-24">
            {/* Centered blood line (desktop only) */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-blood/20 to-transparent md:block" />

            <div className="space-y-12 md:space-y-20">
              {tastingNotes.map((note) => (
                <TimelineNode key={note.act} {...note} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 4: SPECS — Counting Numbers ═══ */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4">
          {/* Top rule */}
          <div className="h-px bg-blood/10" />

          <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-4 md:gap-12 md:py-20">
            {specs.map((spec) => (
              <div key={spec.label} className="text-center">
                <div className="flex items-baseline justify-center gap-1.5">
                  <CountUp
                    value={spec.value}
                    className="font-cinzel text-4xl font-bold text-blood md:text-5xl lg:text-6xl"
                  />
                  <span className="text-[10px] uppercase tracking-wider text-bone/30 md:text-xs">
                    {spec.unit}
                  </span>
                </div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-bone/40 md:text-xs">
                  {spec.label}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom rule */}
          <div className="h-px bg-blood/10" />
        </div>
      </section>

      {/* ═══ Section 5: THE MINERALS ═══ */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-bone/40">
                The Profile
              </p>
              <h2 className="font-cinzel text-3xl font-bold text-offwhite md:text-4xl lg:text-5xl">
                We didn&apos;t add anything.
              </h2>
              <p className="mt-3 text-sm text-bone/40 md:text-base">
                Nature was already showing off.
              </p>
            </div>
          </Reveal>

          <div className="relative mt-12 grid grid-cols-1 gap-px bg-blood/[0.12] sm:grid-cols-2 md:mt-16">
            {minerals.map((m, i) => (
              <motion.div
                key={m.symbol}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[#080808] p-8 md:p-10"
              >
                <span className="font-cinzel text-5xl font-black text-blood/25 md:text-6xl">
                  {m.symbol}
                </span>
                <h3 className="mt-4 font-cinzel text-lg font-bold text-offwhite md:text-xl">
                  {m.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-bone/50 md:text-base">
                  {m.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Section 6: CTA — Clean Close ═══ */}
      <section className="relative overflow-hidden py-32 md:py-40">
        {/* Gradient into footer */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-t from-black/80 to-transparent" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-cinzel text-4xl font-bold text-offwhite md:text-5xl lg:text-6xl">
              Begin the ritual.
            </h2>
          </motion.div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <TransitionLink
              href="/shop"
              className="btn btn-primary px-10 py-3.5 text-sm"
            >
              Shop Now
            </TransitionLink>
            <TransitionLink
              href="/bloodverse"
              className="text-xs uppercase tracking-[0.3em] text-bone/30 transition-colors hover:text-blood/60"
            >
              or explore the Bloodverse
            </TransitionLink>
          </div>

          {/* Faded can sinking into gradient */}
          <div className="pointer-events-none mt-20 flex justify-center">
            <Image
              src="/can.png"
              alt=""
              width={120}
              height={230}
              className="opacity-[0.15] translate-y-8"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
    </>
  )
}
