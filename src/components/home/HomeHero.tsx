"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion"
import Image from "next/image"
import { TransitionLink } from "@/components/ux/TransitionLink"

const BLOOD_LETTERS = ["B", "L", "O", "O", "D"]
const THIRST_LETTERS = ["T", "H", "I", "R", "S", "T"]
const ALL_LETTERS = [...BLOOD_LETTERS, ...THIRST_LETTERS] // 11 total

// Each letter melts/drips downward during exit — cohesive with the can rising up
const SCATTER: { x: number; y: number; r: number }[] = [
  { x: -22, y:  88, r: -17 }, // B
  { x:  -9, y: 100, r:  11 }, // L
  { x:  -3, y:  94, r:  -6 }, // O
  { x:   9, y: 108, r:  14 }, // O
  { x:  17, y:  84, r:  -9 }, // D
  { x:  -5, y: 120, r:  20 }, // T
  { x:  12, y:  96, r: -13 }, // H
  { x: -13, y: 102, r:  17 }, // I
  { x:  20, y:  90, r:  -7 }, // R
  { x:  -4, y: 114, r:  12 }, // S
  { x: -18, y:  86, r: -15 }, // T
]

// ─── Per-letter animated component ─────────────────────────────────────────
function BloodLetter({
  letter,
  index,
  scrollYProgress,
  isVisible,
}: {
  letter: string
  index: number
  scrollYProgress: MotionValue<number>
  isVisible: boolean
}) {
  const total = ALL_LETTERS.length - 1

  // Blood sweep: B turns red first, T last — wave across the word
  // All letters fully red by scroll ~0.18, before the fade starts at 0.16
  const sweep = (index / total) * 0.08

  const letterColor = useTransform(
    scrollYProgress,
    [sweep, 0.05 + sweep, 0.14 + sweep],
    [
      "rgba(246,246,246,0.95)",
      "rgba(176,0,32,0.88)",
      "rgba(176,0,32,1.0)",
    ]
  )
  const letterGlow = useTransform(
    scrollYProgress,
    [sweep, 0.09 + sweep],
    [
      "0 0 0px rgba(176,0,32,0)",
      "0 0 55px rgba(176,0,32,0.75), 0 0 110px rgba(176,0,32,0.3)",
    ]
  )

  // Melt-down: letters drip downward as the text fades (0.20 → 0.34)
  const { x: sx, y: sy, r: sr } = SCATTER[index]
  const letterX = useTransform(scrollYProgress, [0.20, 0.34], [0, sx])
  const letterY = useTransform(scrollYProgress, [0.20, 0.34], [0, sy])
  const letterR = useTransform(scrollYProgress, [0.20, 0.34], [0, sr])

  return (
    <motion.span
      className="inline-block will-change-transform"
      style={{
        // transformPerspective provides the 3D context for the entrance rotateX
        transformPerspective: 600,
        x: letterX,
        y: letterY,
        rotate: letterR,
        color: letterColor,
        textShadow: letterGlow,
      }}
      // 3D flip entrance: each letter rolls in from behind/below
      initial={{ opacity: 0, rotateX: 88 }}
      animate={isVisible ? { opacity: 1, rotateX: 0 } : {}}
      transition={{
        duration: 0.85,
        delay: 0.12 + index * 0.055,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {letter}
    </motion.span>
  )
}

// ─── Hero section ────────────────────────────────────────────────────────────
export default function HomeHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Brief delay so the initial page paint settles before letters animate
    const t = setTimeout(() => setIsVisible(true), 320)
    return () => clearTimeout(t)
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // ── Text parent: scale up + fade out ──────────────────────────────────────
  const textScale   = useTransform(scrollYProgress, [0, 0.28], [1, 2.15])
  const textOpacity = useTransform(scrollYProgress, [0.16, 0.34], [1, 0])
  const textY       = useTransform(scrollYProgress, [0, 0.3],  [0, -16])

  // ── Can: spring-smoothed for natural bounce/overshoot ─────────────────────
  const rawCanScale  = useTransform(scrollYProgress, [0.15, 0.42], [0.5, 1])
  const rawCanY      = useTransform(scrollYProgress, [0.15, 0.42], [70, 0])
  const rawCanRotate = useTransform(scrollYProgress, [0.15, 0.40], [-6, 0])
  const canOpacity   = useTransform(scrollYProgress, [0.15, 0.36], [0, 1])

  // Springs give the can a satisfying "slam" feel — overshoots slightly, then settles
  const canScale  = useSpring(rawCanScale,  { stiffness: 80, damping: 12 })
  const canY      = useSpring(rawCanY,      { stiffness: 90, damping: 14 })
  const canRotate = useSpring(rawCanRotate, { stiffness: 70, damping: 10 })

  // ── Glow orbs ─────────────────────────────────────────────────────────────
  const glowOpacity = useTransform(scrollYProgress, [0.12, 0.42], [0, 0.75])
  const glowScale   = useTransform(scrollYProgress, [0.12, 0.42], [0.4, 1])

  // Sharp blood burst — peaks exactly as the can settles, then softens
  const burstOpacity = useTransform(scrollYProgress, [0.28, 0.40, 0.58], [0, 1, 0.45])
  const burstScale   = useTransform(scrollYProgress, [0.28, 0.44], [0.2, 1.35])

  // ── Bottom content ────────────────────────────────────────────────────────
  const contentOpacity = useTransform(scrollYProgress, [0.40, 0.55], [0, 1])
  const contentY       = useTransform(scrollYProgress, [0.40, 0.55], [28, 0])

  // ── Section ───────────────────────────────────────────────────────────────
  const sectionOpacity  = useTransform(scrollYProgress, [0.62, 0.78], [1, 0])
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.06], [0.8, 0])

  return (
    <section ref={containerRef} className="relative h-[250vh]">
      <motion.div
        style={{ opacity: sectionOpacity }}
        className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden"
      >
        {/* Ambient blood glow — blooms in behind the can */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: glowOpacity, scale: glowScale }}
        >
          <div className="absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/30 blur-[180px]" />
          <div className="absolute top-[60%] left-[40%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/15 blur-[120px]" />
        </motion.div>

        {/* Blood burst — the sharp bloom when the can arrives */}
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ opacity: burstOpacity, scale: burstScale }}
        >
          <div className="h-[520px] w-[520px] rounded-full bg-blood/18 blur-[150px]" />
        </motion.div>

        {/* ── The Can ── */}
        <motion.div
          className="absolute z-10"
          style={{
            scale: canScale,
            opacity: canOpacity,
            y: canY,
            rotate: canRotate,
          }}
        >
          {/* Floating bob — starts only after the can has entered */}
          <motion.div
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          >
            <Image
              src="/can.png"
              alt="BLOODTHIRST by UNHOLY CO."
              width={260}
              height={450}
              className="drop-shadow-[0_0_120px_rgba(176,0,32,0.55)]"
              priority
            />
          </motion.div>
        </motion.div>

        {/* ── BLOODTHIRST Title ── */}
        <motion.h1
          style={{ scale: textScale, opacity: textOpacity, y: textY }}
          className="relative z-20 text-center font-cinzel text-[18vw] font-black uppercase leading-[0.85] tracking-[0.08em] will-change-transform select-none md:text-[9.6vw] md:tracking-[0.14em]"
        >
          {/* BLOOD — block on mobile, inline on desktop */}
          <span className="block whitespace-nowrap md:inline">
            {BLOOD_LETTERS.map((letter, i) => (
              <BloodLetter
                key={i}
                letter={letter}
                index={i}
                scrollYProgress={scrollYProgress}
                isVisible={isVisible}
              />
            ))}
          </span>

          {/* THIRST — block on mobile, inline on desktop */}
          <span className="block whitespace-nowrap md:ml-[0.14em] md:inline">
            {THIRST_LETTERS.map((letter, i) => (
              <BloodLetter
                key={i + BLOOD_LETTERS.length}
                letter={letter}
                index={i + BLOOD_LETTERS.length}
                scrollYProgress={scrollYProgress}
                isVisible={isVisible}
              />
            ))}
          </span>
        </motion.h1>

        {/* ── Subtitle + CTA ── */}
        <motion.div
          className="absolute bottom-[12%] z-30 flex flex-col items-center gap-6 md:bottom-[16%]"
          style={{ opacity: contentOpacity, y: contentY }}
        >
          <p className="text-[10px] uppercase tracking-[0.5em] text-bone/50 md:text-xs">
            Not your salvation
          </p>
          <div className="flex gap-3">
            <TransitionLink href="/bloodthirst" className="btn btn-primary px-6 py-2.5 text-xs">
              Discover
            </TransitionLink>
            <TransitionLink href="/shop" className="btn btn-ghost px-6 py-2.5 text-xs">
              Shop Now
            </TransitionLink>
          </div>
        </motion.div>

        {/* ── Scroll indicator ── */}
        <motion.div
          className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
          style={{ opacity: indicatorOpacity }}
        >
          <span className="text-[9px] uppercase tracking-[0.3em] text-bone/30">Scroll</span>
          <motion.div
            className="h-8 w-px bg-gradient-to-b from-bone/40 to-transparent"
            animate={{ scaleY: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
