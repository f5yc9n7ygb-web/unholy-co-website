"use client"

import Script from "next/script"
import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import Lenis from "lenis"
import { MotionConfig, motion, useScroll } from "framer-motion"

import { useRitualCheckout } from "./hooks/useRitualCheckout"
import { PhaseArrival } from "./components/PhaseArrival"
import { PhaseDescent } from "./components/PhaseDescent"
import { PhaseProof } from "./components/PhaseProof"
import { PhaseOffer } from "./components/PhaseOffer"
import { PhaseClose } from "./components/PhaseClose"
import { RitualCursor } from "./components/RitualCursor"
import { FOOTNOTE } from "@/content/bloodthirst"

const RitualScene = dynamic(
  () => import("./components/RitualScene").then((m) => m.RitualScene),
  { ssr: false }
)

export function BloodThirstShopClient({ razorpayKey }: { razorpayKey?: string }) {
  const checkout = useRitualCheckout({ razorpayKey })
  const [previewClose, setPreviewClose] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const sp = new URLSearchParams(window.location.search)
    setPreviewClose(sp.get("preview") === "close")
  }, [])

  const pageRef = useRef<HTMLDivElement>(null)
  const offerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // ── scroll progress as a ref the R3F scene reads each frame ──
  const scrollProgress = useRef(0)
  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"],
  })
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      scrollProgress.current = v
    })
    return () => unsub()
  }, [scrollYProgress])

  // ── responsive + accessibility flags ──
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 768px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(rm.matches)
    return () => mq.removeEventListener("change", update)
  }, [])

  // ── Lenis smooth scroll (desktop only — touch already smooth) ──
  useEffect(() => {
    if (typeof window === "undefined") return
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches
    if (isTouch || reduceMotion) return

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    let raf = 0
    const tick = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [reduceMotion])

  // ── On sealed: jump to top, play close phase, then auto-redirect after a beat ──
  // NOTE: only depend on isSealed — checkout is recreated each render and would re-fire.
  const goToReceipt = checkout.goToReceipt
  const isSealed = checkout.isSealed
  useEffect(() => {
    if (!isSealed) return
    window.scrollTo({ top: 0, behavior: "instant" })
    const t = setTimeout(() => goToReceipt(), 12000)
    return () => clearTimeout(t)
  }, [isSealed, goToReceipt])

  const skipToOffer = () => {
    offerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // ── Sealed (post-payment) OR preview mode → only the close phase ──
  if (isSealed || previewClose) {
    return (
      <MotionConfig reducedMotion="user">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
        <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a]">
          <BackgroundGlow />
          <RitualCursor />
          <MinimalHeader />
          <PhaseClose
            selected={checkout.selected}
            form={
              previewClose
                ? {
                    name: "Marked, Anonymous",
                    email: "you@unholy.co",
                    phone: "",
                    address: "Address on file",
                    city: "Bombay",
                    pincode: "400001",
                    state: "Maharashtra",
                  }
                : checkout.form
            }
            onContinue={previewClose ? () => history.back() : goToReceipt}
          />
        </div>
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <RitualCursor />

      {/* Atmospheric base — near-black, never pure black */}
      <div className="fixed inset-0 z-0 bg-[#0a0a0a]" aria-hidden />
      <BackgroundGlow />

      {/* 3D ritual scene — fixed full-viewport, transparent canvas */}
      <div className="pointer-events-none fixed inset-0 z-[5]">
        <RitualScene
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          premium={!reduceMotion}
        />
      </div>

      {/* Soft edge vignette — gentle, doesn't drown the can */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[6]"
        style={{
          background:
            "radial-gradient(ellipse 110% 80% at 50% 50%, transparent 55%, rgba(10,10,10,0.55) 95%)",
        }}
      />

      {/* Minimal header — logo only, no nav */}
      <MinimalHeader onSkip={skipToOffer} />

      {/* Scroll spine */}
      <div ref={pageRef} className="relative z-10">
        <PhaseArrival onSkip={skipToOffer} />
        <PhaseDescent />
        <PhaseProof />
        <div ref={offerRef}>
          <PhaseOffer
            selected={checkout.selected}
            onSelect={checkout.selectPack}
            form={checkout.form}
            errors={checkout.errors}
            onChange={checkout.updateField}
            onBlur={checkout.blurField}
            onSign={checkout.sign}
            isSubmitting={checkout.isSubmitting}
            payError={checkout.payError}
          />
        </div>

        {/* Bottom whisper — page closes, doesn't end */}
        <footer className="relative z-10 border-t border-bone/10 px-6 py-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/35">
            {FOOTNOTE}
          </p>
        </footer>
      </div>
    </MotionConfig>
  )
}

/* ─── Minimal header — logo + skip-to-offer link ─── */
function MinimalHeader({ onSkip }: { onSkip?: () => void }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-6 py-5 md:px-10">
      <a
        href="/"
        data-rune
        className="pointer-events-auto font-cinzel text-xs font-black uppercase tracking-[0.45em] text-offwhite/85 transition-colors hover:text-offwhite"
      >
        UNHOLY CO.
      </a>
      <div className="pointer-events-auto flex items-center gap-6">
        {onSkip && (
          <button
            data-rune
            onClick={onSkip}
            className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45 transition-colors hover:text-blood md:inline-flex"
          >
            <span>or just buy</span>
            <span className="inline-block h-px w-5 bg-bone/40 transition-all duration-300 hover:w-8 hover:bg-blood" />
          </button>
        )}
        <span className="font-mono text-[9px] uppercase tracking-[0.45em] text-bone/40">
          BloodThirst
        </span>
      </div>
    </header>
  )
}

/* ─── Background glow orbs — subtle, behind the 3D ─── */
function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[-15%] top-[10%] h-[700px] w-[700px] rounded-full bg-blood/10 blur-[180px]"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute right-[-10%] bottom-[15%] h-[500px] w-[500px] rounded-full bg-blood/8 blur-[140px]"
      />
    </div>
  )
}
