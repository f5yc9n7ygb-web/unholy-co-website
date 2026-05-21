"use client"

import Script from "next/script"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { AnimatePresence, MotionConfig, motion, useScroll } from "framer-motion"

import { useRitualCheckout } from "./hooks/useRitualCheckout"
import { PhaseArrival } from "./components/PhaseArrival"
import { PhaseDescent } from "./components/PhaseDescent"
import { PhaseProof } from "./components/PhaseProof"
import { PhaseOffer } from "./components/PhaseOffer"
import { PhaseClose } from "./components/PhaseClose"
import { RitualCursor } from "./components/RitualCursor"
import { MobileBuyBar } from "./components/MobileBuyBar"
import { FOOTNOTE } from "@/content/bloodthirst"

const RitualScene = dynamic(
  () => import("./components/RitualScene").then((m) => m.RitualScene),
  { ssr: false }
)

/** Preview form used when ?preview=close — lets you see the finale without paying */
const PREVIEW_FORM = {
  name: "Marked, Anonymous",
  email: "you@unholy.co",
  phone: "",
  address: "Address on file",
  city: "Bombay",
  pincode: "400001",
  state: "Maharashtra",
}

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

  const isSealed = checkout.isSealed
  const sealing = isSealed || previewClose

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

  // ── Lenis smooth scroll + GSAP ScrollTrigger sharing one scroll source ──
  useEffect(() => {
    if (typeof window === "undefined") return
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches
    if (reduceMotion || sealing) return

    gsap.registerPlugin(ScrollTrigger)

    // On touch, skip Lenis but still register ScrollTrigger so descent pinning works
    if (isTouch) {
      ScrollTrigger.refresh()
      return () => {
        ScrollTrigger.getAll().forEach((t) => t.kill())
      }
    }

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    lenisRef.current = lenis
    // Drive ScrollTrigger off Lenis so pin / scrub stay in sync
    lenis.on("scroll", ScrollTrigger.update)
    const tickerCb = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tickerCb)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(tickerCb)
      lenis.destroy()
      lenisRef.current = null
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [reduceMotion, sealing])

  // ── On seal: jump to top, lock body scroll while finale plays ──
  useEffect(() => {
    if (!sealing) return
    window.scrollTo({ top: 0, behavior: "instant" })
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [sealing])

  // ── Auto-redirect to receipt after the finale has time to land ──
  const goToReceipt = checkout.goToReceipt
  useEffect(() => {
    if (!isSealed) return
    const t = setTimeout(() => goToReceipt(), 6000)
    return () => clearTimeout(t)
  }, [isSealed, goToReceipt])

  const lenisRef = useRef<Lenis | null>(null)
  const skipToOffer = () => {
    const el = offerRef.current
    if (!el) return
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -40 })
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
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

      {/* 3D ritual scene — stays mounted across the seal so the finale can play */}
      <div className="pointer-events-none fixed inset-0 z-[5]">
        <RitualScene
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          premium={!reduceMotion}
          sealed={sealing}
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

      {/* Sigil-bloom flash — fires once when the seal begins, sits over the dissolve */}
      <AnimatePresence>
        {sealing && (
          <motion.div
            key="bloom"
            aria-hidden
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.4, 1.1, 1.4] }}
            transition={{ duration: 1.6, times: [0, 0.4, 1], delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed inset-0 z-[7]"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(230,57,86,0.55) 0%, rgba(176,0,32,0.25) 28%, transparent 60%)",
              mixBlendMode: "screen",
            }}
          />
        )}
      </AnimatePresence>

      {/* Minimal header — hidden during seal */}
      <AnimatePresence>
        {!sealing && (
          <motion.div
            key="header"
            initial={false}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <MinimalHeader onSkip={skipToOffer} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll spine — fades + blurs out when seal begins */}
      <AnimatePresence>
        {!sealing && (
          <motion.div
            key="spine"
            ref={pageRef}
            initial={false}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
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
                appliedPromo={checkout.appliedPromo}
                effectiveTotal={checkout.effectiveTotal}
                onApplyPromo={checkout.applyPromo}
                onRemovePromo={checkout.removePromo}
              />
            </div>

            <footer className="relative z-10 border-t border-bone/10 px-6 py-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/35">
                {FOOTNOTE}
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-only sticky buy bar — surfaces price + CTA so phone users
          aren't hunting through 6 viewports of lore for the offer. */}
      {!sealing && (
        <MobileBuyBar selected={checkout.selected} onTap={skipToOffer} />
      )}

      {/* PhaseClose — fades in AFTER the can dissolves (~1.3s) */}
      <AnimatePresence>
        {sealing && (
          <motion.div
            key="close"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[20] overflow-y-auto"
          >
            <MinimalHeader />
            <PhaseClose
              selected={checkout.selected}
              form={previewClose ? PREVIEW_FORM : checkout.form}
              total={checkout.confirmedTotal}
              onContinue={previewClose ? () => history.back() : goToReceipt}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

/* ─── Minimal header — logo + skip-to-offer link ─── */
function MinimalHeader({ onSkip }: { onSkip?: () => void }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-6 py-5 md:px-10">
      <Link
        href="/"
        data-rune
        className="pointer-events-auto font-cinzel text-xs font-black uppercase tracking-[0.45em] text-offwhite/85 transition-colors hover:text-offwhite"
      >
        UNHOLY CO.
      </Link>
      <div className="pointer-events-auto flex items-center gap-6">
        {onSkip && (
          <button
            data-rune
            onClick={onSkip}
            className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/55 transition-colors hover:text-blood md:text-[10px]"
          >
            <span>buy</span>
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
