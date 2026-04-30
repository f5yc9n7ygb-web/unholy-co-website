"use client"

import { motion } from "framer-motion"
import { DAMNATION_FACTS } from "@/content/bloodthirst"

/**
 * Damnation Facts — a brutal nutrition-style panel that reads as product lore.
 * Renders inline within the descent phase as the can's runic back face is in view.
 */
export function DamnationFacts({ className = "" }: { className?: string }) {
  return (
    <motion.div
      data-rune
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className={`relative max-w-md border border-bone/20 bg-black/55 p-6 backdrop-blur-md ${className}`}
      style={{ fontFeatureSettings: '"tnum" on' }}
    >
      {/* Corner ticks — brutalist */}
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-blood/80" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-blood/80" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-blood/80" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-blood/80" />

      <p className="font-cinzel text-xs font-black uppercase tracking-[0.4em] text-blood">
        {DAMNATION_FACTS.title}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-bone/45">
        {DAMNATION_FACTS.serving}
      </p>

      <div className="mt-5 h-px w-full bg-bone/15" />

      <ul className="mt-4 divide-y divide-bone/10 font-mono">
        {DAMNATION_FACTS.rows.map((row) => (
          <li
            key={row.label}
            className="flex items-baseline justify-between gap-4 py-2 text-[11px] uppercase tracking-[0.18em]"
          >
            <span className="text-bone/55">{row.label}</span>
            <span className="text-right text-offwhite">{row.value}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 font-mono text-[10px] italic leading-relaxed tracking-wider text-bone/40">
        {DAMNATION_FACTS.footer}
      </p>
    </motion.div>
  )
}
