"use client"

import { motion } from "framer-motion"
import { PROOF_LINES } from "@/content/bloodthirst"

/**
 * Phase 3 — PROOF (reframed).
 *
 * Brutalist quote stack, not a testimonials section. No 5-stars.
 * Sparse. Arrogant. The quotes do the work.
 */
export function PhaseProof() {
  return (
    <section
      data-phase="proof"
      className="relative flex min-h-screen w-full items-center px-6 py-24"
    >
      <div className="mx-auto w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
          className="mb-14 flex items-center gap-4"
        >
          <span className="h-px w-10 bg-blood/70" />
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood/80">
            On record · Unsolicited
          </p>
        </motion.div>

        <ul className="space-y-12 md:space-y-16">
          {PROOF_LINES.map((line, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                delay: i * 0.08,
                duration: 0.85,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative grid gap-3 md:grid-cols-[auto,1fr] md:gap-6"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/35 md:pt-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <blockquote className="font-cinzel text-[clamp(1.4rem,3.5vw,2.8rem)] font-black uppercase leading-[1.05] tracking-[-0.005em] text-offwhite">
                  <span className="text-blood/70">&quot;</span>
                  {line.quote}
                  <span className="text-blood/70">&quot;</span>
                </blockquote>
                <div className="mt-3 flex items-center gap-3">
                  <span className="h-px w-10 bg-blood/60 transition-all duration-500 group-hover:w-16" />
                  <cite className="font-mono text-[10px] not-italic uppercase tracking-[0.35em] text-bone/45">
                    {line.attr}
                  </cite>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
