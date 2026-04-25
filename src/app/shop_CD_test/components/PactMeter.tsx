"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Beat 5 — Pact Meter.
 *
 * Scarcity + live social proof in one module. The meter fills as people
 * claim their batch; a ticker rotates through "just sealed" events.
 *
 * Uses deterministic pseudo-live data seeded from the current timestamp —
 * drifts slowly, looks real, no backend required. Swap for a real
 * /api/batch-status endpoint when ready.
 */

const CITIES = [
  "Mumbai", "Bangalore", "Delhi", "Hyderabad", "Pune", "Chennai",
  "Gurgaon", "Noida", "Goa", "Kolkata", "Jaipur", "Ahmedabad",
  "Chandigarh", "Indore", "Surat", "Lucknow",
]

const INITIALS = ["A", "P", "R", "S", "K", "M", "N", "J", "V", "D", "T", "I", "Y", "H"]

const PACKS_LABEL: Record<string, string> = {
  pack6: "TASTE",
  pack12: "RITUAL",
  pack24: "DEVOTION",
}
const PACK_IDS = Object.keys(PACKS_LABEL)

type TickerEvent = {
  id: string
  initial: string
  city: string
  pack: string
  minutesAgo: number
}

// Deterministic PRNG for stable server/client rendering
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function PactMeter({
  claimed,
  total,
}: {
  claimed: number
  total: number
}) {
  const [events, setEvents] = useState<TickerEvent[]>([])
  const [activeIdx, setActiveIdx] = useState(0)

  // Seed the initial event list deterministically so SSR matches client
  const seedEvents = useMemo<TickerEvent[]>(() => {
    const seed = Math.floor(Date.now() / (1000 * 60 * 5)) // new seed every 5 min
    const rng = mulberry32(seed)
    const out: TickerEvent[] = []
    for (let i = 0; i < 14; i++) {
      const ini = INITIALS[Math.floor(rng() * INITIALS.length)]
      const city = CITIES[Math.floor(rng() * CITIES.length)]
      const pack = PACK_IDS[Math.floor(rng() * PACK_IDS.length)]
      out.push({
        id: `seed-${i}`,
        initial: ini,
        city,
        pack: PACKS_LABEL[pack],
        minutesAgo: Math.floor(rng() * 180) + 1,
      })
    }
    return out
  }, [])

  useEffect(() => {
    setEvents(seedEvents)
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % seedEvents.length)
    }, 4200)
    return () => clearInterval(timer)
  }, [seedEvents])

  const fillPercent = Math.min(100, (claimed / total) * 100)
  const remaining = total - claimed

  const current = events[activeIdx]

  return (
    <section className="relative overflow-hidden bg-black py-20 md:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Heading */}
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.4em] text-blood/70 md:text-[11px]">
              // batch 001
            </p>
            <h3 className="font-cinzel text-2xl font-black uppercase leading-[0.95] text-offwhite md:text-3xl">
              Claimed<br className="md:hidden" />
              <span className="text-blood"> in real time.</span>
            </h3>
          </div>
          <div className="text-right font-mono tabular-nums">
            <div className="font-cinzel text-3xl font-black text-offwhite md:text-5xl">
              {claimed.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-bone/40 md:text-[11px]">
              of {total.toLocaleString()} claimed
            </div>
          </div>
        </div>

        {/* The meter */}
        <div
          className="relative h-[6px] w-full overflow-hidden rounded-full border border-white/5 bg-white/[0.03]"
          role="progressbar"
          aria-valuenow={fillPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${claimed} of ${total} claimed`}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: `${fillPercent}%` }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "linear-gradient(90deg, rgba(176,0,32,0.8), rgba(176,0,32,1))",
              boxShadow: "0 0 14px rgba(176,0,32,0.7)",
            }}
          />
          {/* Shimmer pulse at the frontier */}
          <motion.div
            className="absolute inset-y-0 w-8 rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
            style={{ left: `calc(${fillPercent}% - 2rem)` }}
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Remaining + rate */}
        <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50 md:text-[11px]">
          <span>
            <span className="text-blood">{remaining.toLocaleString()}</span> remaining
          </span>
          <span className="text-bone/40">// closes when claimed</span>
        </div>

        {/* Ticker */}
        <div className="relative mt-10 h-14 overflow-hidden">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.id + "-" + activeIdx}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center gap-3 text-xs md:text-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blood/40 bg-blood/10 font-cinzel text-xs font-bold text-blood">
                  {current.initial}
                </span>
                <span className="font-mono text-bone/70">
                  <span className="text-offwhite">{current.initial}.</span>
                  <span className="text-bone/40"> from </span>
                  <span className="text-offwhite">{current.city}</span>
                  <span className="text-bone/40"> sealed the </span>
                  <span className="font-cinzel font-bold tracking-[0.15em] text-blood">{current.pack}</span>
                  <span className="text-bone/40"> pact · </span>
                  <span className="text-bone/60">
                    {current.minutesAgo < 60
                      ? `${current.minutesAgo}m ago`
                      : `${Math.floor(current.minutesAgo / 60)}h ${current.minutesAgo % 60}m ago`}
                  </span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
