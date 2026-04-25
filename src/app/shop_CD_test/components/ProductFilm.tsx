"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { motion, useScroll, useTransform } from "framer-motion"

/**
 * Beat 2 — Product Film.
 *
 * Scroll-pinned 3D can cinematic reveal, reusing the existing
 * CinematicCanScene. 300vh container, sticky viewport, scroll-driven
 * camera + rotation choreography, overlaid stats orbit.
 */

const CinematicCanScene = dynamic(
  () => import("@/components/3d/CinematicCanScene").then((m) => m.CinematicCanScene),
  { ssr: false, loading: () => null }
)

const STATS = [
  { label: "ALT", value: "11,000 FT", blurb: "Source elevation" },
  { label: "pH", value: "7.8", blurb: "Naturally alkaline" },
  { label: "TDS", value: "160 PPM", blurb: "Mineral density" },
  { label: "HSN", value: "2201", blurb: "Natural mineral water" },
  { label: "SUGAR", value: "ZERO", blurb: "Nothing added" },
]

export function ProductFilm() {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)
  const [isMobile, setIsMobile] = useState(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      scrollProgressRef.current = v
    })
    return unsub
  }, [scrollYProgress])

  // Overlay text opacity bands
  const heroOpacity = useTransform(scrollYProgress, [0.0, 0.08, 0.18, 0.22], [0, 1, 1, 0])
  const statsOpacity = useTransform(scrollYProgress, [0.25, 0.35, 0.78, 0.85], [0, 1, 1, 0])
  const outroOpacity = useTransform(scrollYProgress, [0.88, 0.95], [0, 1])

  // Which stat is highlighted (0-4)
  const statIndexRaw = useTransform(scrollYProgress, [0.3, 0.8], [0, STATS.length - 1])

  return (
    <section
      ref={containerRef}
      className="relative h-[300vh] bg-black"
      aria-label="BloodThirst cinematic reveal"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* Ambient glow behind scene */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 800px 600px at 50% 50%, rgba(176,0,32,0.12), transparent 65%)",
          }}
        />

        {/* The 3D scene fills the viewport */}
        <div className="absolute inset-0">
          <CinematicCanScene scrollProgress={scrollProgressRef} isMobile={isMobile} />
        </div>

        {/* Hero overlay — visible at the start */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="pointer-events-none absolute left-1/2 top-[18%] z-10 w-full max-w-2xl -translate-x-1/2 px-4 text-center"
        >
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.5em] text-blood/80 md:text-[11px]">
            // the artifact
          </p>
          <h2 className="font-cinzel text-2xl font-black uppercase leading-[0.95] text-offwhite md:text-4xl lg:text-5xl">
            500ml. <span className="text-blood">One shot</span> at the mountain.
          </h2>
        </motion.div>

        {/* Stats orbit — visible during the mid-scroll */}
        <motion.div
          style={{ opacity: statsOpacity }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-4 md:px-16"
        >
          {/* Left column: label + value of current stat */}
          <div className="hidden max-w-[18rem] md:block">
            <StatReadout indexRaw={statIndexRaw} />
          </div>

          {/* Right column: static meta */}
          <div className="ml-auto hidden max-w-[16rem] text-right md:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
              // forged in uttarakhand
              <br />
              // bottled at source
              <br />
              // unpasteurized
            </p>
          </div>
        </motion.div>

        {/* Mobile stats strip — bottom */}
        <motion.div
          style={{ opacity: statsOpacity }}
          className="pointer-events-none absolute bottom-20 left-0 right-0 z-10 flex justify-center md:hidden"
        >
          <MobileStatReadout indexRaw={statIndexRaw} />
        </motion.div>

        {/* Outro — visible at the end */}
        <motion.div
          style={{ opacity: outroOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-[12%] z-10 text-center"
        >
          <p className="font-cinzel text-base font-black uppercase tracking-[0.4em] text-offwhite md:text-lg">
            Now <span className="text-blood">choose your pact.</span>
          </p>
          <div className="mx-auto mt-3 h-px w-16 bg-blood/50" />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <motion.div
            className="h-8 w-px bg-gradient-to-b from-bone/40 to-transparent"
            animate={{ scaleY: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </div>
    </section>
  )
}

function StatReadout({ indexRaw }: { indexRaw: { get: () => number } }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    let raf: number
    const loop = () => {
      const v = Math.round(indexRaw.get())
      setIdx((prev) => (prev !== v ? v : prev))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [indexRaw])

  const stat = STATS[Math.max(0, Math.min(STATS.length - 1, idx))]

  return (
    <motion.div
      key={stat.label}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-2"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood/80">
        {stat.label}
      </div>
      <div className="font-cinzel text-5xl font-black leading-none text-offwhite md:text-6xl">
        {stat.value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50">
        {stat.blurb}
      </div>
    </motion.div>
  )
}

function MobileStatReadout({ indexRaw }: { indexRaw: { get: () => number } }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    let raf: number
    const loop = () => {
      const v = Math.round(indexRaw.get())
      setIdx((prev) => (prev !== v ? v : prev))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [indexRaw])
  const stat = STATS[Math.max(0, Math.min(STATS.length - 1, idx))]
  return (
    <motion.div
      key={stat.label}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-full border border-white/10 bg-black/60 px-5 py-2.5 backdrop-blur-xl"
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-blood/80">
        {stat.label}
      </span>
      <span className="ml-3 font-cinzel text-base font-black text-offwhite">
        {stat.value}
      </span>
    </motion.div>
  )
}
