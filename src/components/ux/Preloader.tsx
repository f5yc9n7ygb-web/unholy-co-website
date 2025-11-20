"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Image from "next/image"
import { useEffect, useState } from "react"
import logoMark from "@/../public/uhc-logo.png"

const DISPLAY_DURATION = 2200

export function Preloader() {
  const prefersReducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => setShouldRender(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  useEffect(() => {
    const duration = prefersReducedMotion ? 400 : DISPLAY_DURATION
    const timer = setTimeout(() => setIsVisible(false), duration)
    return () => clearTimeout(timer)
  }, [prefersReducedMotion])

  if (!shouldRender) return null

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
              transition={{ duration: 0.5, ease: [0.4, 0.05, 0.2, 1] }}
            >
              <Image
                src={logoMark}
                alt="UNHOLY CO. mark"
                fill
                priority
                placeholder="empty"
                className="object-contain"
              />
            </motion.div>
            <motion.span
              className="preloader-spine"
              initial={{ opacity: 0, scaleY: 0.3 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.6, ease: [0.4, 0.05, 0.2, 1] }}
            />
            <motion.h1
              className="preloader-wordmark"
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              animate={{ opacity: 1, letterSpacing: "0.5em" }}
              exit={{ opacity: 0, y: -12, transition: { duration: 0.3 } }}
              transition={{ duration: 0.7, ease: [0.4, 0.05, 0.2, 1] }}
            >
              UNHOLY CO.
            </motion.h1>
            <motion.p
              className="preloader-tagline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.25 } }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.4, 0.05, 0.2, 1] }}
            >
              BLOODTHIRST RITUAL IN PROGRESS
            </motion.p>
          </div>

          <div className="preloader-progress">
            <motion.span
              initial={{ width: "5%" }}
              animate={{ width: isVisible ? "80%" : "100%" }}
              exit={{ width: "100%", transition: { duration: 0.4, ease: [0.4, 0.05, 0.2, 1] } }}
              transition={{ duration: 1.8, ease: [0.6, 0.05, 0.4, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
