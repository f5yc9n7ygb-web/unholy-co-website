"use client"

import { motion } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"

const fadeUp = (delay = 0) => ({
  initial: { y: 20 },
  animate: { y: 0 },
  transition: { duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export function BloodverseHero() {
  return (
    <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-4">

      {/* Deep blood atmosphere */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/[0.07] blur-[140px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/[0.06] blur-[60px]" />
      </div>

      {/* Ghost watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
      >
        <span className="font-cinzel font-black leading-none text-[18vw] text-blood/[0.05]">
          LORE
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">

        {/* Sigil ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex justify-center"
        >
          <div className="relative flex h-20 w-20 items-center justify-center">
            {/* Outer pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border border-blood/40"
            />
            {/* Middle ring */}
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              className="absolute inset-2 rounded-full border border-blood/30"
            />
            {/* Inner glow */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-blood/50 bg-blood/10 shadow-[0_0_32px_rgba(176,0,32,0.4)]">
              <div className="h-2 w-2 rounded-full bg-blood shadow-[0_0_8px_rgba(176,0,32,0.9)]" />
            </div>
          </div>
        </motion.div>

        {/* Eyebrow */}
        <motion.p {...fadeUp(0.1)} className="mb-5 text-[10px] uppercase tracking-[0.6em] text-blood/60">
          Interactive Lore
        </motion.p>

        {/* Heading */}
        <motion.h1
          {...fadeUp(0.18)}
          className="font-cinzel text-5xl font-bold leading-tight text-offwhite md:text-7xl lg:text-8xl"
        >
          The<br />Bloodverse
        </motion.h1>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto my-8 h-px w-24 origin-center bg-gradient-to-r from-transparent via-blood/60 to-transparent"
        />

        {/* Description */}
        <motion.p
          {...fadeUp(0.3)}
          className="mx-auto max-w-md text-sm leading-relaxed text-bone/40 md:text-base"
        >
          Hydration is the ritual. The can is the altar.<br className="hidden md:block" />
          Scan the sigil — unlock the chapter that bleeds through that batch.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.42)}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <TransitionLink
            href="/bloodverse/chapter-1"
            className="btn btn-primary px-8 py-3.5 text-sm"
          >
            Start Chapter I
          </TransitionLink>
          <TransitionLink
            href="/#subscribe"
            className="text-xs uppercase tracking-[0.3em] text-bone/30 transition-colors hover:text-blood/60"
          >
            Join the circle
          </TransitionLink>
        </motion.div>

      </div>

      {/* Bottom fade into vault */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />

    </section>
  )
}
