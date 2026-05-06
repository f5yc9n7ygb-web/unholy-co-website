"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { ARRIVAL } from "@/content/bloodthirst"

/**
 * Phase 1 — ARRIVAL.
 *
 * Tagline letter-by-letter cascade. No CTA. The product earns the CTA later.
 * Composition: batch tag top-left, scroll hint bottom-center, headline lower-third
 * with brutalist brackets so the can stays dominant in the upper-middle.
 */
export function PhaseArrival({ onSkip }: { onSkip?: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const headingOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0])
  const headingY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])

  const letters = ARRIVAL.tagline.split("")

  return (
    <section
      ref={ref}
      data-phase="arrival"
      className="relative h-screen w-full"
    >
      {/* Batch tag — top left, just below the header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4 }}
        className="absolute left-6 top-[80px] z-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/55 md:left-10 md:top-[96px]"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blood" />
        <span>{ARRIVAL.batch}</span>
      </motion.div>

      {/* Headline — lower-third, brackets framing it */}
      <motion.div
        style={{ opacity: headingOpacity, y: headingY }}
        className="absolute inset-x-0 bottom-[18vh] z-10 mx-auto max-w-6xl px-6 text-center"
      >
        {/* Top bracket rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.45, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-7 h-px w-44 origin-center bg-gradient-to-r from-transparent via-blood to-transparent"
        />

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
                  delay: 0.55 + i * 0.04,
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
          transition={{ delay: 0.55 + letters.length * 0.04 + 0.15, duration: 0.9 }}
          className="mt-7 font-mono text-xs uppercase tracking-[0.4em] text-bone/55"
        >
          {ARRIVAL.subline}
        </motion.p>

        {/* Bottom bracket rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.55 + letters.length * 0.04 + 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-7 h-px w-44 origin-center bg-gradient-to-r from-transparent via-blood to-transparent"
        />
      </motion.div>

      {/* Scroll hint — bottom, fades fast */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        style={{ opacity: hintOpacity }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.5em] text-bone/40"
      >
        <span className="mr-3 inline-block h-px w-6 align-middle bg-bone/35" />
        scroll
        <span className="ml-3 inline-block h-px w-6 align-middle bg-bone/35" />
      </motion.div>

      {/* Subtle "or just buy" — appears bottom-right after the cascade */}
      {onSkip && (
        <motion.button
          data-rune
          onClick={onSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.8 }}
          style={{ opacity: hintOpacity }}
          className="absolute bottom-7 right-6 z-10 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.45em] text-bone/45 transition-colors hover:text-blood md:right-10 md:text-[10px]"
        >
          <span>skip the ritual</span>
          <span className="inline-block h-px w-5 bg-bone/30 transition-all duration-300 hover:w-8 hover:bg-blood" />
        </motion.button>
      )}
    </section>
  )
}
