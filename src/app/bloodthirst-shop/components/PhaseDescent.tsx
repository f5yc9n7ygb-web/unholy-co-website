"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { DESCENT_CARDS } from "@/content/bloodthirst"
import { DamnationFacts } from "./DamnationFacts"

/**
 * Phase 2 — DESCENT.
 *
 * Three full-viewport scroll panels, alternating sides so the copy never
 * sits over the same area of the can as it orbits. A persistent vertical
 * depth meter on the side tracks scroll progress through the descent —
 * makes it feel like an actual descent.
 */
export function PhaseDescent() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const meterFill = useTransform(scrollYProgress, [0.15, 0.9], [0, 1])
  const meterOpacity = useTransform(scrollYProgress, [0, 0.1, 0.92, 1], [0, 1, 1, 0])

  return (
    <section ref={ref} data-phase="descent" className="relative w-full">
      {/* DEPTH METER — fixed left rail, only visible while descent is on-screen */}
      <motion.div
        aria-hidden
        style={{ opacity: meterOpacity }}
        className="pointer-events-none fixed left-6 top-1/2 z-20 hidden -translate-y-1/2 md:block"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45">
            DESCENT
          </span>
          <div className="relative h-48 w-px bg-bone/20">
            <motion.div
              className="absolute inset-x-0 top-0 origin-top bg-blood"
              style={{ scaleY: meterFill, height: "100%" }}
            />
            <span className="absolute -left-1 top-0 h-2 w-2 rounded-full border border-bone/40 bg-[#0a0a0a]" />
            <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-bone/40 bg-[#0a0a0a]" />
            <span className="absolute -left-1 bottom-0 h-2 w-2 rounded-full border border-bone/40 bg-[#0a0a0a]" />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45">
            FLOOR
          </span>
        </div>
      </motion.div>

      {DESCENT_CARDS.map((card, i) => (
        <DescentPanel
          key={card.eyebrow}
          card={card}
          index={i}
          total={DESCENT_CARDS.length}
          side={i % 2 === 0 ? "right" : "left"}
        />
      ))}
    </section>
  )
}

function DescentPanel({
  card,
  index,
  total,
  side,
}: {
  card: (typeof DESCENT_CARDS)[number]
  index: number
  total: number
  side: "left" | "right"
}) {
  const isFacts = index === 2
  const align = side === "right" ? "md:ml-auto md:mr-8 lg:mr-20" : "md:ml-8 md:mr-auto lg:ml-20"

  return (
    <div className="relative flex h-screen w-full items-center">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div
          className={`relative max-w-md ${align} ${
            side === "right" ? "md:text-right" : "md:text-left"
          }`}
        >
          {/* Index counter */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-[10px] uppercase tracking-[0.45em] text-blood/80"
          >
            {card.eyebrow}
            <span className="mx-2 text-bone/30">·</span>
            <span className="text-bone/40">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ delay: 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 font-cinzel text-[clamp(1.6rem,3.6vw,3rem)] font-black uppercase leading-[1.05] tracking-[-0.005em] text-offwhite"
          >
            {card.line}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ delay: 0.22, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 max-w-sm text-base leading-relaxed text-bone/65 md:max-w-md md:text-lg"
          >
            {card.body}
          </motion.p>

          {/* Brutalist rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={`mt-7 h-px w-24 origin-left bg-blood/60 ${
              side === "right" ? "md:ml-auto md:origin-right" : "md:origin-left"
            }`}
          />

          {isFacts && (
            <div className={`mt-10 ${side === "right" ? "md:ml-auto" : ""}`}>
              <DamnationFacts />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
