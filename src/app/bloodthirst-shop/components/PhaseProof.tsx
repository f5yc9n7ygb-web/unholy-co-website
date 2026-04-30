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
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
          className="mb-12 font-mono text-[10px] uppercase tracking-[0.5em] text-blood/70"
        >
          On record — unsolicited
        </motion.p>

        <ul className="space-y-10 md:space-y-14">
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
              className="group relative"
            >
              <blockquote className="font-cinzel text-[clamp(1.4rem,3.5vw,2.8rem)] font-black uppercase leading-[1.05] tracking-[-0.005em] text-offwhite">
                <span className="text-blood/70">"</span>
                {line.quote}
                <span className="text-blood/70">"</span>
              </blockquote>
              <div className="mt-3 flex items-center gap-3">
                <span className="h-px w-10 bg-blood/60 transition-all duration-500 group-hover:w-16" />
                <cite className="font-mono text-[10px] not-italic uppercase tracking-[0.35em] text-bone/45">
                  {line.attr}
                </cite>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
