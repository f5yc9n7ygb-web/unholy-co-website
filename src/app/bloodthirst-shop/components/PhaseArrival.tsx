"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { ARRIVAL } from "@/content/bloodthirst"

/**
 * Phase 1 — ARRIVAL.
 *
 * Tagline letter-by-letter cascade. No CTA. The product earns the CTA later.
 */
export function PhaseArrival() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const headingOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0])
  const headingY = useTransform(scrollYProgress, [0, 1], [0, -40])

  const letters = ARRIVAL.tagline.split("")

  return (
    <section
      ref={ref}
      data-phase="arrival"
      className="relative flex h-screen w-full items-end justify-center pb-[18vh] sm:pb-[14vh]"
    >
      <motion.div
        style={{ opacity: headingOpacity, y: headingY }}
        className="relative z-10 mx-auto max-w-5xl px-6 text-center"
      >
        {/* Top whisper */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9 }}
          className="mb-7 font-mono text-[10px] uppercase tracking-[0.45em] text-bone/45"
        >
          {ARRIVAL.batch}
        </motion.p>

        {/* Brutal serif tagline — letter cascade */}
        <h1 className="font-cinzel text-[clamp(2.25rem,7vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.01em] text-offwhite">
          <span aria-label={ARRIVAL.tagline} className="inline-block">
            {letters.map((char, i) => (
              <motion.span
                key={i}
                aria-hidden
                initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: 0.55 + i * 0.045,
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block"
                style={{ whiteSpace: char === " " ? "pre" : "normal" }}
              >
                {char}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 + letters.length * 0.045 + 0.2, duration: 0.9 }}
          className="mt-7 font-mono text-xs uppercase tracking-[0.4em] text-bone/55"
        >
          {ARRIVAL.subline}
        </motion.p>
      </motion.div>

      {/* Scroll hint — bottom, fades out fast */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        style={{ opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]) }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.5em] text-bone/35"
      >
        <span className="mr-3 inline-block h-px w-6 align-middle bg-bone/30" />
        scroll
        <span className="ml-3 inline-block h-px w-6 align-middle bg-bone/30" />
      </motion.div>
    </section>
  )
}
