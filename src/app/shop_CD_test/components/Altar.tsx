"use client"

import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"

/**
 * Beat 1 — the Altar.
 *
 * A cinematic pre-fold intro: black screen, soft red altar glow,
 * the can fades in, and the buying path is immediately visible.
 *
 * Above-fold CTAs let cold buyers choose a pack or jump to checkout.
 */
export function Altar({
  onChoosePack,
  onCheckout,
}: {
  onChoosePack: () => void
  onCheckout: () => void
}) {
  const { scrollY } = useScroll()
  // Subtle parallax as user scrolls past
  const canY = useTransform(scrollY, [0, 800], [0, -140])
  const canOpacity = useTransform(scrollY, [0, 600], [1, 0.4])
  const titleOpacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Ambient pulse */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 700px 500px at 50% 45%, rgba(176,0,32,0.18), transparent 70%)",
        }}
      />

      {/* Batch signal — top left, quiet */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute left-4 top-[84px] z-20 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/60 md:left-8 md:top-[110px] md:text-[11px]"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blood" />
        <span>Batch 001</span>
        <span className="text-bone/20">·</span>
        <span className="tabular-nums">Limited run</span>
        <span className="hidden text-bone/40 sm:inline">ships across India</span>
      </motion.div>

      {/* Scroll hint — top right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.6 }}
        className="absolute right-4 top-[84px] z-20 hidden items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40 md:right-8 md:top-[110px] md:flex md:text-[11px]"
      >
        <span>Scroll to continue</span>
        <span className="h-px w-8 bg-bone/30" />
      </motion.div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {/* Vertical altar glow behind the can */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[560px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          initial={{ scale: 0.78, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            scale: { duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.25 },
            opacity: { duration: 0.7, delay: 0.25 },
          }}
          style={{
            background:
              "radial-gradient(ellipse at 50% 55%, rgba(176,0,32,0.42) 0%, rgba(176,0,32,0.16) 38%, transparent 72%)",
            boxShadow:
              "0 0 90px rgba(176,0,32,0.28), inset 0 0 80px rgba(176,0,32,0.16)",
            filter: "blur(16px)",
          }}
        />

        {/* The Can */}
        <motion.div
          className="relative z-20 mt-6"
          style={{ y: canY, opacity: canOpacity }}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-[94%] h-12 w-56 -translate-x-1/2 rounded-full"
              style={{
                background: "radial-gradient(ellipse, rgba(176,0,32,0.7) 0%, transparent 70%)",
                filter: "blur(22px)",
              }}
            />
            <Image
              src="/can.webp"
              alt="BloodThirst mineral water — Blackout Edition"
              width={300}
              height={520}
              priority
              className="relative h-auto w-[200px] drop-shadow-[0_40px_80px_rgba(176,0,32,0.6)] md:w-[260px]"
              draggable={false}
            />
          </motion.div>
        </motion.div>

        {/* Headline */}
        <motion.div
          style={{ opacity: titleOpacity }}
          className="relative z-20 mt-12 max-w-2xl text-center md:mt-16"
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mb-4 text-[10px] uppercase tracking-[0.6em] text-blood/70 md:text-[11px]"
          >
            Blackout Edition · 500ml
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-cinzel text-3xl font-black uppercase leading-[0.95] tracking-[0.02em] text-offwhite md:text-5xl lg:text-6xl"
          >
            Water for the<br />
            <span className="text-blood">unholy few.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.1 }}
            className="mt-6 text-xs text-bone/50 md:text-sm"
          >
            Himalayan mineral water. Cold-forged. Zero sugar. Zero plastic.<br className="hidden md:inline" />
            <span className="text-bone/35">Sold in batches. Delivered across India.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.25 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <button
              type="button"
              onClick={onChoosePack}
              className="w-full rounded-xl bg-blood px-7 py-3.5 font-cinzel text-xs font-black uppercase tracking-[0.25em] text-white shadow-[0_0_40px_rgba(176,0,32,0.45)] transition-transform hover:scale-[1.02] sm:w-auto"
            >
              Choose pack
            </button>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-7 py-3.5 font-cinzel text-xs font-bold uppercase tracking-[0.25em] text-bone transition-colors hover:border-blood/50 hover:text-offwhite sm:w-auto"
            >
              Checkout
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.45 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-[0.25em] text-bone/35 md:text-[10px]"
          >
            <span>From ₹169/can</span>
            <span className="h-1 w-1 rounded-full bg-bone/20" />
            <span>Free shipping</span>
            <span className="h-1 w-1 rounded-full bg-bone/20" />
            <span>GST included</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.4 }}
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/40">
          Descend
        </span>
        <motion.div
          className="h-10 w-px bg-gradient-to-b from-bone/50 to-transparent"
          animate={{ scaleY: [1, 0.3, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "top" }}
        />
      </motion.div>
    </section>
  )
}
