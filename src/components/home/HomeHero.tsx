"use client"

import { useRef, useState, useEffect } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  type MotionValue,
} from "framer-motion"
import Image from "next/image"
import gsap from "gsap"
import { TransitionLink } from "@/components/ux/TransitionLink"
import FluidCanvas from "./FluidCanvas"

// ─── Constants ──────────────────────────────────────────────────────────────

const BLOOD_LETTERS = ["B", "L", "O", "O", "D"]
const THIRST_LETTERS = ["T", "H", "I", "R", "S", "T"]
const ALL_LETTERS = [...BLOOD_LETTERS, ...THIRST_LETTERS]

type Phase = "idle" | "rift" | "text" | "can" | "complete"

// 3D explosion vectors — letters fly outward in all directions on scroll
const EXPLOSION = [
  { x: -280, y: -200, rx: 55, ry: -40, rz: -25, s: 0.15 },
  { x: -140, y: 240, rx: -30, ry: 50, rz: 18, s: 0.2 },
  { x: -50, y: -300, rx: 70, ry: 15, rz: -40, s: 0.1 },
  { x: 90, y: 200, rx: -45, ry: -55, rz: 30, s: 0.18 },
  { x: 240, y: -160, rx: 35, ry: 65, rz: -12, s: 0.15 },
  { x: -200, y: 280, rx: -60, ry: 25, rz: 45, s: 0.12 },
  { x: 170, y: -240, rx: 40, ry: -50, rz: -35, s: 0.2 },
  { x: -90, y: 320, rx: -25, ry: 60, rz: 22, s: 0.15 },
  { x: 260, y: 140, rx: 55, ry: -40, rz: -48, s: 0.18 },
  { x: -180, y: -320, rx: -50, ry: 30, rz: 38, s: 0.1 },
  { x: 120, y: 280, rx: 45, ry: -65, rz: -18, s: 0.16 },
]

// ─── Magnetic Letter ────────────────────────────────────────────────────────

function BloodLetter({
  letter,
  index,
  mouseRef,
  phase,
  scrollYProgress,
}: {
  letter: string
  index: number
  mouseRef: { current: { x: number; y: number } }
  phase: Phase
  scrollYProgress: MotionValue<number>
}) {
  const ref = useRef<HTMLSpanElement>(null)

  // Magnetic repulsion from cursor
  const magX = useMotionValue(0)
  const magY = useMotionValue(0)
  const springMagX = useSpring(magX, { stiffness: 200, damping: 22 })
  const springMagY = useSpring(magY, { stiffness: 200, damping: 22 })

  useEffect(() => {
    if (phase !== "complete") return
    let raf: number
    const loop = () => {
      const el = ref.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = mouseRef.current.x - cx
        const dy = mouseRef.current.y - cy
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const scrollFade = Math.max(0, 1 - scrollYProgress.get() * 8)
        const strength = Math.max(0, 1 - dist / 350) * 28 * scrollFade
        magX.set((-dx / dist) * strength)
        magY.set((-dy / dist) * strength)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, magX, magY, mouseRef, scrollYProgress])

  // Scroll-driven 3D explosion
  const exp = EXPLOSION[index]
  const explodeX = useTransform(scrollYProgress, [0.06, 0.26], [0, exp.x])
  const explodeY = useTransform(scrollYProgress, [0.06, 0.26], [0, exp.y])
  const explodeRX = useTransform(scrollYProgress, [0.06, 0.26], [0, exp.rx])
  const explodeRY = useTransform(scrollYProgress, [0.06, 0.26], [0, exp.ry])
  const explodeRZ = useTransform(scrollYProgress, [0.06, 0.26], [0, exp.rz])
  const explodeScale = useTransform(scrollYProgress, [0.06, 0.26], [1, exp.s])

  // Combine magnetic + explosion offsets
  const combinedX = useTransform(
    [springMagX, explodeX],
    ([m, e]) => (m as number) + (e as number)
  )
  const combinedY = useTransform(
    [springMagY, explodeY],
    ([m, e]) => (m as number) + (e as number)
  )

  // Blood color sweep (B turns red first, T last)
  const sweep = (index / 10) * 0.06
  const letterColor = useTransform(
    scrollYProgress,
    [sweep, 0.04 + sweep, 0.12 + sweep],
    ["rgba(246,246,246,0.95)", "rgba(176,0,32,0.88)", "rgba(176,0,32,1.0)"]
  )
  const letterGlow = useTransform(
    scrollYProgress,
    [sweep, 0.08 + sweep],
    [
      "0 0 0px rgba(176,0,32,0)",
      "0 0 60px rgba(176,0,32,0.7), 0 0 120px rgba(176,0,32,0.25)",
    ]
  )

  const showText = phase === "text" || phase === "can" || phase === "complete"

  return (
    <motion.span
      className="inline-block"
      style={{ transformPerspective: 800 }}
      initial={{ opacity: 0, rotateX: 88, y: 50 }}
      animate={showText ? { opacity: 1, rotateX: 0, y: 0 } : {}}
      transition={{
        duration: 0.65,
        delay: 0.06 + index * 0.045,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <motion.span
        ref={ref}
        className="inline-block will-change-transform"
        style={{
          x: combinedX,
          y: combinedY,
          rotateX: explodeRX,
          rotateY: explodeRY,
          rotateZ: explodeRZ,
          scale: explodeScale,
          color: letterColor,
          textShadow: letterGlow,
          transformPerspective: 800,
        }}
      >
        {letter}
      </motion.span>
    </motion.span>
  )
}

// ─── Hero Section ───────────────────────────────────────────────────────────

export default function HomeHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const [phase, setPhase] = useState<Phase>("idle")

  // ── Mouse tracking ────────────────────────────────────────────────────────
  const mouseXNorm = useMotionValue(0.5)
  const mouseYNorm = useMotionValue(0.5)

  useEffect(() => {
    // Init to center so touch devices have zero magnetic offset
    mouseRef.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }
    const handler = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      mouseXNorm.set(e.clientX / window.innerWidth)
      mouseYNorm.set(e.clientY / window.innerHeight)
    }
    window.addEventListener("mousemove", handler)
    return () => window.removeEventListener("mousemove", handler)
  }, [mouseXNorm, mouseYNorm])

  // ── 3D scene tilt from cursor ─────────────────────────────────────────────
  const rawTiltX = useTransform(mouseYNorm, [0, 1], [2.5, -2.5])
  const rawTiltY = useTransform(mouseXNorm, [0, 1], [-2.5, 2.5])
  const tiltX = useSpring(rawTiltX, { stiffness: 80, damping: 25 })
  const tiltY = useSpring(rawTiltY, { stiffness: 80, damping: 25 })

  // ── Entrance sequence ─────────────────────────────────────────────────────
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("rift"), 350),
      setTimeout(() => setPhase("text"), 850),
      setTimeout(() => setPhase("can"), 1550),
      setTimeout(() => setPhase("complete"), 2400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // Screen shake when letters slam in
  useEffect(() => {
    if (phase !== "text" || !shakeRef.current) return
    const el = shakeRef.current
    const tl = gsap.timeline()
    const offsets = [3, -4, 2, -3, 4, -2, 1, -1]
    offsets.forEach((v, i) => {
      tl.to(el, {
        x: v * (1 - i / offsets.length),
        y: (v * 0.6) * (i % 2 === 0 ? 1 : -1),
        duration: 0.04,
      })
    })
    tl.to(el, { x: 0, y: 0, duration: 0.12, ease: "power2.out" })
  }, [phase])

  // ── Scroll ────────────────────────────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Text parent transforms
  const textScale = useTransform(scrollYProgress, [0, 0.22], [1, 1.6])
  const textOpacity = useTransform(scrollYProgress, [0.10, 0.28], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 0.25], [0, -20])

  // ── Can — magnetic tracking ───────────────────────────────────────────────
  const canMagX = useMotionValue(0)
  const canMagY = useMotionValue(0)
  const canTiltY = useMotionValue(0)
  const canTiltX = useMotionValue(0)
  const springCanMagX = useSpring(canMagX, { stiffness: 50, damping: 20 })
  const springCanMagY = useSpring(canMagY, { stiffness: 50, damping: 20 })
  const springCanTiltY = useSpring(canTiltY, { stiffness: 70, damping: 18 })
  const springCanTiltX = useSpring(canTiltX, { stiffness: 70, damping: 18 })

  useEffect(() => {
    if (phase !== "complete") return
    let raf: number
    const loop = () => {
      const mx = mouseRef.current.x / window.innerWidth - 0.5
      const my = mouseRef.current.y / window.innerHeight - 0.5
      const fade = Math.max(0, 1 - scrollYProgress.get() * 5)
      canMagX.set(mx * 35 * fade)
      canMagY.set(my * 25 * fade)
      canTiltY.set(mx * 10 * fade)
      canTiltX.set(-my * 6 * fade)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, canMagX, canMagY, canTiltX, canTiltY, scrollYProgress])

  // Can scroll transforms
  const canScrollScale = useTransform(scrollYProgress, [0, 0.15, 0.35], [1, 1.06, 1.12])

  // ── Glow layers ───────────────────────────────────────────────────────────
  const glowOpacity = useTransform(scrollYProgress, [0.08, 0.35], [0, 0.8])
  const glowScale = useTransform(scrollYProgress, [0.08, 0.35], [0.5, 1])
  const burstOpacity = useTransform(scrollYProgress, [0.22, 0.35, 0.52], [0, 1, 0.4])
  const burstScale = useTransform(scrollYProgress, [0.22, 0.40], [0.2, 1.4])

  // ── Bottom content ────────────────────────────────────────────────────────
  const contentOpacity = useTransform(scrollYProgress, [0.35, 0.50], [0, 1])
  const contentY = useTransform(scrollYProgress, [0.35, 0.50], [30, 0])

  // ── Section fade ──────────────────────────────────────────────────────────
  const sectionOpacity = useTransform(scrollYProgress, [0.58, 0.75], [1, 0])
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.05], [0.8, 0])

  // Derived booleans
  const showFluid = phase !== "idle"
  const showCan = phase === "can" || phase === "complete"

  return (
    <section ref={containerRef} className="relative h-[250vh]">
      <motion.div
        style={{ opacity: sectionOpacity }}
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
      >
        {/* ── Layer 0: WebGL Fluid Shader ── */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: showFluid ? 1 : 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <FluidCanvas className="h-full w-full" />
        </motion.div>

        {/* ── Layer 1: Blood Rift ── */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[2px] -translate-x-1/2 -translate-y-1/2"
          initial={{ width: 0, opacity: 0 }}
          animate={
            phase === "rift"
              ? { width: "120%", opacity: 1 }
              : phase === "idle"
                ? { width: 0, opacity: 0 }
                : { width: "120%", opacity: 0 }
          }
          transition={
            phase === "rift"
              ? {
                  width: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.12 },
                }
              : { opacity: { duration: 0.8, delay: 0.3 } }
          }
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #B00020 20%, rgba(255,255,255,0.9) 50%, #B00020 80%, transparent 100%)",
            boxShadow:
              "0 0 40px rgba(176,0,32,0.9), 0 0 80px rgba(176,0,32,0.5), 0 0 160px rgba(176,0,32,0.25)",
          }}
        />

        {/* ── Layer 2: Blood glow orbs ── */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: glowOpacity, scale: glowScale }}
        >
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/30 blur-[180px]" />
          <div className="absolute left-[40%] top-[60%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/15 blur-[120px]" />
        </motion.div>

        {/* Blood burst */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ opacity: burstOpacity, scale: burstScale }}
        >
          <div className="h-[520px] w-[520px] rounded-full bg-blood/18 blur-[150px]" />
        </motion.div>

        {/* ── Layer 3: Shake wrapper → 3D tilt wrapper → Content ── */}
        <div ref={shakeRef} className="absolute inset-0">
          <motion.div
            className="flex h-full items-center justify-center"
            style={{
              rotateX: tiltX,
              rotateY: tiltY,
              transformPerspective: 1200,
              transformStyle: "preserve-3d",
            }}
          >
            {/* ── The Can ── */}
            <motion.div
              className="absolute z-10"
              initial={{ y: 140, opacity: 0, scale: 0.6 }}
              animate={
                showCan
                  ? { y: 0, opacity: 1, scale: 1 }
                  : { y: 140, opacity: 0, scale: 0.6 }
              }
              transition={{ type: "spring", stiffness: 70, damping: 11 }}
            >
              <motion.div
                style={{
                  x: springCanMagX,
                  y: springCanMagY,
                  rotateX: springCanTiltX,
                  rotateY: springCanTiltY,
                  scale: canScrollScale,
                  transformPerspective: 1000,
                }}
              >
                <motion.div
                  animate={{ y: [0, -9, 0] }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
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
            </motion.div>

            {/* ── BLOODTHIRST Title ── */}
            <motion.h1
              style={{ scale: textScale, opacity: textOpacity, y: textY }}
              className="relative z-20 select-none text-center font-cinzel text-[18vw] font-black uppercase leading-[0.85] tracking-[0.08em] will-change-transform md:text-[9.6vw] md:tracking-[0.14em]"
            >
              <span className="block whitespace-nowrap md:inline">
                {BLOOD_LETTERS.map((letter, i) => (
                  <BloodLetter
                    key={i}
                    letter={letter}
                    index={i}
                    mouseRef={mouseRef}
                    phase={phase}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </span>
              <span className="block whitespace-nowrap md:ml-[0.14em] md:inline">
                {THIRST_LETTERS.map((letter, i) => (
                  <BloodLetter
                    key={i + BLOOD_LETTERS.length}
                    letter={letter}
                    index={i + BLOOD_LETTERS.length}
                    mouseRef={mouseRef}
                    phase={phase}
                    scrollYProgress={scrollYProgress}
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
                <TransitionLink
                  href="/bloodthirst"
                  className="btn btn-primary px-6 py-2.5 text-xs"
                >
                  Discover
                </TransitionLink>
                <TransitionLink
                  href="/shop"
                  className="btn btn-ghost px-6 py-2.5 text-xs"
                >
                  Shop Now
                </TransitionLink>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Scroll indicator ── */}
        <motion.div
          className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
          style={{ opacity: indicatorOpacity }}
        >
          <span className="text-[9px] uppercase tracking-[0.3em] text-bone/30">
            Scroll
          </span>
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
