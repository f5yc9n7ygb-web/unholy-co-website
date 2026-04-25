"use client"

import { motion } from "framer-motion"

/**
 * Beat 3 — Anchor Line.
 *
 * Lists competitor prices next to BloodThirst to reframe ₹200 as
 * "less than Evian, infinitely more interesting." Pricing is public
 * retail reference, shown in de-emphasized type until BloodThirst lands.
 */

const rows = [
  { name: "SAN PELLEGRINO", price: "₹180", unit: "250ML", dim: true },
  { name: "EVIAN", price: "₹250", unit: "500ML", dim: true },
  { name: "BLOODTHIRST", price: "₹200", unit: "500ML · BLACKOUT", dim: false },
]

export function AnchorLine() {
  return (
    <section className="relative overflow-hidden bg-black py-24 md:py-32">
      <div className="container mx-auto max-w-3xl px-4">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-10 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-bone/40 md:mb-14 md:text-[11px]"
        >
          // context, for the skeptical
        </motion.p>

        <div className="space-y-3 md:space-y-4">
          {rows.map((row, i) => (
            <motion.div
              key={row.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.7,
                delay: i * 0.18,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`flex items-baseline justify-between gap-4 border-b py-4 md:py-5 ${
                row.dim ? "border-white/5" : "border-blood/30"
              }`}
            >
              <span
                className={`font-cinzel text-sm font-bold uppercase tracking-[0.18em] md:text-lg ${
                  row.dim ? "text-bone/35" : "text-offwhite"
                }`}
              >
                {row.name}
              </span>
              <span
                className={`flex items-baseline gap-3 font-mono tabular-nums ${
                  row.dim ? "text-bone/40" : "text-offwhite"
                }`}
              >
                <span className={`text-base font-bold md:text-2xl ${row.dim ? "" : "text-blood"}`}>
                  {row.price}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-[0.3em] md:text-[10px] ${
                    row.dim ? "text-bone/30" : "text-bone/60"
                  }`}
                >
                  {row.unit}
                </span>
              </span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-bone/35 md:text-[11px]"
        >
          // per ml you pay less.&nbsp;
          <span className="text-bone/60">per story you pay more.</span>
        </motion.p>
      </div>
    </section>
  )
}
