"use client"

import { motion } from "framer-motion"
import { DESCENT_CARDS } from "@/content/bloodthirst"
import { DamnationFacts } from "./DamnationFacts"

/**
 * Phase 2 — DESCENT.
 *
 * Three full-viewport scroll panels, alternating sides so the copy never
 * sits over the same area of the can as it orbits. The Damnation Facts panel
 * lands with card 03 — the camera is on the runic back of the can at that point.
 */
export function PhaseDescent() {
  return (
    <section data-phase="descent" className="relative w-full">
      {DESCENT_CARDS.map((card, i) => (
        <DescentPanel
          key={card.eyebrow}
          card={card}
          index={i}
          side={i % 2 === 0 ? "right" : "left"}
        />
      ))}
    </section>
  )
}

function DescentPanel({
  card,
  index,
  side,
}: {
  card: (typeof DESCENT_CARDS)[number]
  index: number
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
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-[10px] uppercase tracking-[0.45em] text-blood/80"
          >
            {card.eyebrow}
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
