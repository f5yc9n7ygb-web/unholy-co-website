"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"
import { CountUp } from "@/components/ux/CountUp"

/* ─── Data ─── */

const milestones = [
  {
    year: "2021",
    title: "The Vow",
    body: "After witnessing mountains of disposable plastic at festivals, we swore to build a water brand that felt like a rebellion, not a compromise.",
  },
  {
    year: "2022",
    title: "Forging BloodThirst",
    body: "We sourced Himalayan mineral water and engineered aluminum tallboys with a gothic finish that could live in clubs, galleries, and underground venues.",
  },
  {
    year: "2023",
    title: "The First Drop",
    body: "Our launch batch sold out in 48 hours. BloodThirst showed up on DJ riders, in speakeasy fridges, and at dawn recovery circles.",
  },
  {
    year: "2024",
    title: "The Bloodverse",
    body: "We released narrative chapters hidden inside each can to celebrate the mythology — because hydration should also tell a story.",
  },
]

const pillars = [
  {
    num: "01",
    title: "Design with bite",
    body: "We obsess over typography, material, and texture so every can looks like an artifact from the future. The aesthetic is as important as the hydration.",
  },
  {
    num: "02",
    title: "Planet first",
    body: "Aluminum is infinitely recyclable. Our supply chain is optimized for reuse, from bulk shipping cartons to deposit-return pilots.",
  },
  {
    num: "03",
    title: "Community powered",
    body: "BloodThirst lives where counterculture thrives — independent venues, galleries, rider requests, and the people willing to taste something different.",
  },
]

const stats = [
  { value: "48", unit: "hrs", label: "First batch sold out" },
  { value: "4", unit: "years", label: "Building the brand" },
  { value: "3", unit: "pillars", label: "Core principles" },
  { value: "0", unit: "bottles", label: "Zero plastic — ever" },
]

/* ─── Main Component ─── */

export function StoryClient() {
  /* Section 1: opener scroll refs */
  const openerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: openerRef,
    offset: ["start start", "end start"],
  })

  /* Ghost year drifts + scales on scroll */
  const ghostScale = useTransform(scrollYProgress, [0, 1], [1, 1.18])
  const ghostOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const titleY = useTransform(scrollYProgress, [0, 0.6], [0, -30])
  const titleOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <>
      {/* ═══ Section 1: TEXT-ONLY CINEMATIC OPENER ═══ */}
      <section ref={openerRef} className="relative h-[120vh]">
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-4">
          {/* Ghost year — pure typographic texture */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
            style={{ scale: ghostScale, opacity: ghostOpacity }}
          >
            <span className="font-cinzel text-[28vw] font-black leading-none text-bone/[0.03]">
              MMXXI
            </span>
          </motion.div>

          {/* Main headline block */}
          <motion.div
            className="relative z-10 text-center"
            style={{ y: titleY, opacity: titleOpacity }}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/60">
              Origin Myth
            </p>
            <h1 className="font-cinzel text-4xl font-bold leading-tight text-offwhite md:text-6xl lg:text-7xl">
              From oath to<br className="hidden md:block" /> cult classic.
            </h1>
            <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-bone/40 md:text-base">
              A late-night promise between friends. Kill plastic bottles in India.
              Elevate hydration into a ritual.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ Section 2: PULL QUOTE ═══ */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="border-l-[3px] border-blood/70 pl-8 md:pl-12"
          >
            <blockquote className="font-cinzel text-2xl font-bold leading-snug text-offwhite/80 md:text-3xl lg:text-4xl">
              Water brands typically whisper.<br />
              We wanted to scream.
            </blockquote>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 max-w-2xl text-base leading-relaxed text-bone/50 md:text-lg md:pl-[calc(3rem+3px)]"
          >
            Instead of clear bottles and beachside marketing, we designed a drink for
            those who live after dark — the artists, producers, designers, and rebels
            who demand better. Every can is a statement against waste and mediocrity.
          </motion.p>
        </div>
      </section>

      {/* ═══ Section 3: YEAR-COLUMN TIMELINE ═══ */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 md:mb-16"
          >
            <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-bone/40">
              Four years
            </p>
            <h2 className="font-cinzel text-3xl font-bold text-offwhite md:text-4xl lg:text-5xl">
              The journey.
            </h2>
          </motion.div>

          {/* Timeline chapters */}
          <div>
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Top rule */}
                <div className="h-px bg-blood/[0.12]" />

                <div className="grid grid-cols-[72px_1fr] gap-6 py-10 md:grid-cols-[120px_1fr] md:gap-12 md:py-14">
                  {/* Year — left dateline */}
                  <div className="pt-1">
                    <span className="font-cinzel text-sm font-bold text-blood/50 md:text-base">
                      {m.year}
                    </span>
                  </div>

                  {/* Content — right */}
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-offwhite md:text-2xl">
                      {m.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-bone/50 md:text-base">
                      {m.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Final bottom rule */}
            <div className="h-px bg-blood/[0.12]" />
          </div>
        </div>
      </section>

      {/* ═══ Section 4: BRAND STATS ═══ */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4">
          <div className="h-px bg-blood/10" />

          <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-4 md:gap-12 md:py-20">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-baseline justify-center gap-1.5">
                  <CountUp
                    value={stat.value}
                    className="font-cinzel text-4xl font-bold text-blood md:text-5xl lg:text-6xl"
                  />
                  <span className="text-[10px] uppercase tracking-wider text-bone/30 md:text-xs">
                    {stat.unit}
                  </span>
                </div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-bone/40 md:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="h-px bg-blood/10" />
        </div>
      </section>

      {/* ═══ Section 5: PILLARS — Horizontal Divider Layout ═══ */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 md:mb-16"
          >
            <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-bone/40">
              How we build
            </p>
            <h2 className="font-cinzel text-3xl font-bold text-offwhite md:text-4xl lg:text-5xl">
              The principles.
            </h2>
          </motion.div>

          <div>
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="h-px bg-blood/[0.12]" />

                <div className="grid grid-cols-[72px_1fr] gap-6 py-10 md:grid-cols-[120px_1fr] md:gap-12 md:py-14">
                  {/* Ordinal — left */}
                  <div className="pt-1">
                    <span className="font-cinzel text-sm font-bold text-bone/20 md:text-base">
                      {pillar.num}
                    </span>
                  </div>

                  {/* Content — right */}
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-offwhite md:text-2xl">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-bone/50 md:text-base">
                      {pillar.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="h-px bg-blood/[0.12]" />
          </div>
        </div>
      </section>

      {/* ═══ Section 6: CTA ═══ */}
      <section className="relative overflow-hidden py-32 md:py-40">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-t from-black/80 to-transparent" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-bone/40">
              Chapter V
            </p>
            <h2 className="font-cinzel text-4xl font-bold text-offwhite md:text-5xl lg:text-6xl">
              The story continues.
            </h2>
            <p className="mx-auto mt-6 max-w-sm text-sm text-bone/40">
              Every can is a new chapter. The ritual is ongoing.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <TransitionLink href="/bloodthirst" className="btn btn-primary px-10 py-3.5 text-sm">
              Taste BloodThirst
            </TransitionLink>
            <TransitionLink
              href="/bloodverse"
              className="text-xs uppercase tracking-[0.3em] text-bone/30 transition-colors hover:text-blood/60"
            >
              or explore the Bloodverse
            </TransitionLink>
          </motion.div>
        </div>
      </section>
    </>
  )
}
