"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { PACKS, type Pack } from "@/lib/shop/catalog"
import { RollingPrice } from "./RollingPrice"

/**
 * The Pact Dial — the killer interaction of the shop.
 *
 * Three stops on a rail (6 · 12 · 24). As the user moves between stops,
 * a constellation of can silhouettes behind the hero can animates to
 * match the pack size, prices roll, and a savings pill appears.
 *
 * Keyboard: ← → to cycle stops. Click to jump.
 */

const RITES: Record<string, { rite: string; subtitle: string }> = {
  pack6: { rite: "TASTE", subtitle: "For the curious" },
  pack12: { rite: "RITUAL", subtitle: "For the devoted" },
  pack24: { rite: "DEVOTION", subtitle: "For the cult" },
}

// Pre-computed can constellation positions for each pack size.
// Radial clusters behind the hero can, in viewport-relative units.
// Each entry: [x%, y%, depth 0..1 (controls scale/blur)]
function buildConstellation(qty: number): Array<[number, number, number]> {
  const seed = qty * 9973
  const points: Array<[number, number, number]> = []
  const count = Math.min(qty - 1, 18) // cap at 18 satellites for perf
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (seed % 7) * 0.01
    const ring = Math.floor(i / 6)
    const radius = 140 + ring * 70 + ((seed + i * 131) % 40)
    const jitterY = ((seed + i * 271) % 50) - 25
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius * 0.55 + jitterY
    const depth = 0.45 + ring * 0.22 + ((i * 37) % 15) / 100
    points.push([x, y, Math.min(depth, 0.92)])
  }
  return points
}

export function PactDial({
  selected,
  onSelect,
  appliedDiscount = 0,
}: {
  selected: Pack
  onSelect: (pack: Pack) => void
  appliedDiscount?: number
}) {
  const selectedIndex = PACKS.findIndex((p) => p.id === selected.id)
  const constellation = useMemo(() => buildConstellation(selected.qty), [selected.qty])

  // Anchor: buying 6-packs at ₹200/can to hit current pack qty
  const nominalPrice = selected.qty * PACKS[0].perCan
  const savings = nominalPrice - selected.price

  return (
    <section
      id="pact-dial"
      className="relative overflow-hidden bg-black py-24 md:py-32"
      aria-labelledby="dial-heading"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(176,0,32,0.18) 0%, rgba(176,0,32,0.04) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="container relative mx-auto max-w-6xl px-4">
        {/* Eyebrow + heading */}
        <div className="mb-14 text-center md:mb-20">
          <p className="mb-5 text-[10px] uppercase tracking-[0.5em] text-blood/70 md:text-xs">
            Choose Your Pact
          </p>
          <h2
            id="dial-heading"
            className="font-cinzel text-4xl font-black uppercase leading-[0.95] tracking-[-0.01em] text-offwhite md:text-6xl lg:text-7xl"
          >
            How deep<br />
            <span className="text-blood">do you thirst?</span>
          </h2>
        </div>

        {/* Constellation stage — the killer visual */}
        <div className="relative mx-auto flex h-[440px] w-full items-center justify-center md:h-[520px]">
          {/* Satellite cans — the stack behind the hero */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
          >
            <AnimatePresence mode="sync">
              {constellation.map(([x, y, depth], i) => {
                const scale = 0.3 + depth * 0.45
                const blur = (1 - depth) * 4
                const opacity = 0.15 + depth * 0.45
                return (
                  <motion.div
                    key={`${selected.id}-${i}`}
                    initial={{
                      opacity: 0,
                      x: 0,
                      y: 0,
                      scale: scale * 0.4,
                    }}
                    animate={{
                      opacity,
                      x,
                      y,
                      scale,
                    }}
                    exit={{ opacity: 0, scale: scale * 0.5 }}
                    transition={{
                      duration: 0.9,
                      delay: i * 0.028,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      filter: `blur(${blur}px)`,
                      zIndex: Math.round(depth * 100),
                    }}
                  >
                    <Image
                      src="/can.webp"
                      alt=""
                      width={180}
                      height={310}
                      className="h-auto w-[180px]"
                      aria-hidden="true"
                      draggable={false}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Hero can — the anchor */}
          <motion.div
            className="relative z-[200] will-change-transform"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-[92%] h-10 w-48 -translate-x-1/2 rounded-full"
              style={{
                background: "radial-gradient(ellipse, rgba(176,0,32,0.6) 0%, transparent 70%)",
                filter: "blur(24px)",
              }}
            />
            <Image
              src="/can.webp"
              alt="BloodThirst can"
              width={280}
              height={480}
              priority
              className="relative h-auto w-[210px] drop-shadow-[0_30px_60px_rgba(176,0,32,0.55)] md:w-[260px]"
              draggable={false}
            />
          </motion.div>

          {/* Multiplier badge — fires on change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id + "-mult"}
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 8 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute right-[8%] top-[14%] z-[250] md:right-[16%] md:top-[18%]"
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ boxShadow: "0 0 60px 10px rgba(176,0,32,0.55)" }}
                />
                <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full border border-blood/60 bg-black/90 backdrop-blur-xl md:h-24 md:w-24">
                  <span className="font-cinzel text-[10px] uppercase tracking-[0.25em] text-blood/80">
                    × pack
                  </span>
                  <span
                    className="font-cinzel text-2xl font-black leading-none text-offwhite md:text-3xl"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {selected.qty}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* The Dial — three stops on a rail */}
        <div className="relative mx-auto mt-12 max-w-3xl md:mt-16">
          <div className="relative px-2 md:px-8">
            {/* Rail */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              aria-hidden="true"
            />

            {/* Active segment fill */}
            <motion.div
              className="pointer-events-none absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-blood/60 via-blood to-blood/60"
              style={{
                left: `${8}%`,
                boxShadow: "0 0 12px rgba(176,0,32,0.7)",
              }}
              animate={{
                width: `${selectedIndex === 0 ? 0 : (selectedIndex / (PACKS.length - 1)) * 84}%`,
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />

            <div className="relative grid grid-cols-3 gap-2">
              {PACKS.map((pack) => {
                const isActive = pack.id === selected.id
                const info = RITES[pack.id] ?? { rite: pack.title, subtitle: "" }
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => onSelect(pack)}
                    aria-pressed={isActive}
                    aria-label={`Select ${info.rite} — ${pack.qty} cans for ₹${pack.price}`}
                    className="group relative flex flex-col items-center gap-3 py-4 transition-all"
                  >
                    {/* Dot */}
                    <div className="relative">
                      <motion.div
                        className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-300"
                        animate={{
                          borderColor: isActive ? "#B00020" : "rgba(255,255,255,0.18)",
                          backgroundColor: isActive ? "#B00020" : "rgba(0,0,0,0.85)",
                        }}
                        style={{
                          boxShadow: isActive ? "0 0 20px rgba(176,0,32,0.7)" : "none",
                        }}
                      >
                        {isActive && (
                          <motion.div
                            className="h-1.5 w-1.5 rounded-full bg-white"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </motion.div>
                      {/* Halo */}
                      {isActive && (
                        <motion.div
                          layoutId="dial-halo"
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: "radial-gradient(circle, rgba(176,0,32,0.45), transparent 70%)",
                            filter: "blur(10px)",
                            transform: "scale(3.5)",
                          }}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="text-center">
                      <div
                        className={`font-cinzel text-sm font-bold tracking-[0.2em] transition-colors duration-300 md:text-base ${
                          isActive ? "text-offwhite" : "text-bone/35 group-hover:text-bone/60"
                        }`}
                      >
                        {info.rite}
                      </div>
                      <div
                        className={`mt-1 text-[9px] uppercase tracking-[0.25em] transition-colors duration-300 md:text-[10px] ${
                          isActive ? "text-blood/80" : "text-bone/20 group-hover:text-bone/40"
                        }`}
                      >
                        {pack.qty} cans
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Price readout + savings */}
        <div className="mx-auto mt-14 max-w-xl text-center md:mt-16">
          <div className="flex items-baseline justify-center gap-3">
            <RollingPrice
              value={selected.price - appliedDiscount}
              prefix="₹"
              className="font-cinzel text-5xl font-black leading-none text-offwhite md:text-6xl"
            />
          </div>

          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] text-bone/40 md:text-xs">
            <span>
              <RollingPrice
                value={selected.perCan}
                prefix="₹"
                className="font-mono tabular-nums text-bone/60"
              />
              <span className="ml-1 text-bone/40">/ can</span>
            </span>
            <span className="h-1 w-1 rounded-full bg-bone/20" />
            <span>Free shipping</span>
            <span className="h-1 w-1 rounded-full bg-bone/20" />
            <span>Incl. GST</span>
          </div>

          {/* Savings pill */}
          <AnimatePresence mode="wait">
            {savings > 0 && (
              <motion.div
                key={selected.id + "-save"}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.9 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-blood/40 bg-blood/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-blood backdrop-blur-sm md:text-[11px]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blood animate-pulse" />
                You save ₹{savings.toLocaleString("en-IN")} vs buying 6-packs
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
