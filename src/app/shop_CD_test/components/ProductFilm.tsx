"use client"

import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { motion, useScroll, useTransform } from "framer-motion"

/**
 * Shop-specific 3D can inspection.
 *
 * The motion is simpler and commerce-focused: inspect the can, read the
 * product proof points, then continue to checkout. The 3D scene is split
 * into a separate client-only chunk so three.js stays out of the worker
 * bundle (Cloudflare Workers 3 MiB limit).
 */

const ShopCanScene = dynamic(() => import("./ShopCanScene"), {
  ssr: false,
  loading: () => null,
})

const PROOF_POINTS = [
  { label: "FORMAT", value: "500ML", blurb: "Matte-black aluminium can" },
  { label: "SUGAR", value: "ZERO", blurb: "No sweeteners. Nothing added." },
  { label: "SOURCE", value: "HIMALAYAN", blurb: "Natural mineral water" },
  { label: "PACKS", value: "6 / 12 / 24", blurb: "Pick your batch size" },
]

export function ProductFilm() {
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      progressRef.current = value
    })
    return unsubscribe
  }, [scrollYProgress])

  const canX = useTransform(scrollYProgress, [0, 0.45, 1], ["-10%", "0%", "10%"])
  const scanY = useTransform(scrollYProgress, [0.12, 0.88], ["18%", "82%"])
  const leftOpacity = useTransform(scrollYProgress, [0.08, 0.2, 0.78, 0.9], [0, 1, 1, 0])
  const rightOpacity = useTransform(scrollYProgress, [0.18, 0.3, 0.86, 0.96], [0, 1, 1, 0])

  return (
    <section
      ref={containerRef}
      className="relative h-[165vh] overflow-hidden bg-black"
      aria-label="BloodThirst 3D product inspection"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 820px 560px at 50% 56%, rgba(176,0,32,0.18), transparent 68%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
          aria-hidden="true"
        />

        <motion.div
          style={{ opacity: leftOpacity }}
          className="absolute left-4 top-[15%] z-20 max-w-[16rem] md:left-16 md:top-[22%] md:max-w-xs"
        >
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.45em] text-blood/75 md:text-[11px]">
            // inspect the can
          </p>
          <h2 className="font-cinzel text-3xl font-black uppercase leading-[0.92] text-offwhite md:text-5xl">
            Not a bottle.<br />
            <span className="text-blood">A black can.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-bone/55 md:text-base">
            Natural Himalayan mineral water in a 500ml aluminium can, made to sit on a desk,
            in a gym bag, or on a late-night table without looking ordinary.
          </p>
        </motion.div>

        <motion.div
          style={{ x: canX }}
          className="absolute inset-y-[10%] left-1/2 z-10 w-[58vw] max-w-[420px] -translate-x-1/2 md:w-[32vw]"
        >
          <ShopCanScene progress={progressRef} />
        </motion.div>

        <motion.div
          style={{ top: scanY }}
          className="pointer-events-none absolute left-[12%] right-[12%] z-30 h-px bg-gradient-to-r from-transparent via-blood/80 to-transparent shadow-[0_0_24px_rgba(176,0,32,0.8)]"
          aria-hidden="true"
        />

        <motion.div
          style={{ opacity: rightOpacity }}
          className="absolute bottom-[10%] right-4 z-20 grid w-[calc(100%-2rem)] max-w-xl grid-cols-2 gap-3 md:right-16 md:top-1/2 md:w-[24rem] md:-translate-y-1/2"
        >
          {PROOF_POINTS.map((point, i) => (
            <motion.div
              key={point.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="rounded-xl border border-white/[0.07] bg-black/55 p-4 backdrop-blur-xl"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-blood/70">
                {point.label}
              </p>
              <p className="mt-2 font-cinzel text-xl font-black uppercase leading-none text-offwhite md:text-2xl">
                {point.value}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-bone/45">
                {point.blurb}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
