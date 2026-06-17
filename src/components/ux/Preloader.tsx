"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import logoMark from "@/public/uhc-logo.png"

const DISPLAY_DURATION = 1800
// Minimum time the preloader stays visible (even if image loads instantly)
const MIN_DISPLAY = 600

// Paid-traffic landing pages skip the intro — every second of brand theatre
// before the product costs conversions on cold ad clicks.
const SKIP_ROUTES = ["/buy"]

export function Preloader() {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [logoReady, setLogoReady] = useState(false)
  const mountTime = useState(() => Date.now())[0]

  useEffect(() => {
    try {
      if (sessionStorage.getItem("unholy-visited")) {
        setIsFirstVisit(false)
        setIsVisible(false)
      } else {
        sessionStorage.setItem("unholy-visited", "1")
      }
    } catch {
      // SSR or storage unavailable
    }
  }, [])

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => setShouldRender(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  // Wait for BOTH: logo loaded AND minimum display time elapsed
  useEffect(() => {
    if (!isFirstVisit || !logoReady) return
    const duration = prefersReducedMotion ? 400 : DISPLAY_DURATION
    const elapsed = Date.now() - mountTime
    const remaining = Math.max(0, duration - elapsed)
    // Ensure at least MIN_DISPLAY ms of visibility
    const delay = Math.max(remaining, MIN_DISPLAY - elapsed)
    const timer = setTimeout(() => setIsVisible(false), delay)
    return () => clearTimeout(timer)
  }, [prefersReducedMotion, isFirstVisit, logoReady, mountTime])

  // Safety valve: if the image never loads, dismiss after a generous timeout
  useEffect(() => {
    if (!isFirstVisit) return
    const timer = setTimeout(() => setLogoReady(true), 5000)
    return () => clearTimeout(timer)
  }, [isFirstVisit])

  if (SKIP_ROUTES.includes(pathname)) return null
  if (!shouldRender || !isFirstVisit) return null

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="preloader"
          className="preloader-overlay fixed inset-0 z-[200] overflow-hidden text-offwhite"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.6, 0.05, 0.15, 0.95] }}
          style={{ pointerEvents: isVisible ? "auto" : "none" }}
        >
          <div className="preloader-grain" aria-hidden />

          <motion.div
            className="preloader-curtain"
            initial={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.76, 0.05, 0.24, 1] }}
          />

          <div className="preloader-content">
            <motion.div
              className="preloader-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={logoMark}
                alt="UNHOLY CO. mark"
                fill
                priority
                placeholder="empty"
                className="object-contain"
                onLoad={() => setLogoReady(true)}
              />
            </motion.div>
            <motion.span
              className="preloader-spine"
              initial={{ opacity: 0, scaleY: 0.3 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.h1
              className="preloader-wordmark"
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              animate={{ opacity: 1, letterSpacing: "0.5em" }}
              exit={{ opacity: 0, y: -12, transition: { duration: 0.3 } }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              UNHOLY CO.
            </motion.h1>
            <motion.p
              className="preloader-tagline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.25 } }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              BLOODTHIRST RITUAL IN PROGRESS
            </motion.p>
          </div>

          <div className="preloader-progress">
            <motion.span
              initial={{ width: "5%" }}
              animate={{ width: isVisible ? "80%" : "100%" }}
              exit={{ width: "100%", transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
              transition={{ duration: 1.8, ease: [0.6, 0.05, 0.4, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
