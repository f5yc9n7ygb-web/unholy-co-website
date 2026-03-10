"use client"

import { useEffect, useRef } from "react"

/*
  ScrollSkew — applies a skewY transform based on scroll velocity.
  Optimized: uses a single RAF loop shared across all instances
  via a module-level velocity tracker.
*/

// Module-level shared velocity tracker (one RAF for all ScrollSkew instances)
let scrollVelocity = 0
let lastScrollY = 0
let listenerCount = 0
let rafId: number | null = null

function startTracking() {
  if (rafId !== null) return

  const onScroll = () => {
    const current = window.scrollY
    scrollVelocity = current - lastScrollY
    lastScrollY = current
  }

  const tick = () => {
    scrollVelocity *= 0.92 // decay
    rafId = requestAnimationFrame(tick)
  }

  window.addEventListener("scroll", onScroll, { passive: true })
  lastScrollY = window.scrollY
  rafId = requestAnimationFrame(tick)

  return () => {
    window.removeEventListener("scroll", onScroll)
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }
}

let cleanupTracking: (() => void) | null = null

interface ScrollSkewProps {
  children: React.ReactNode
  className?: string
  maxSkew?: number
  smooth?: number
}

export function ScrollSkew({
  children,
  className = "",
  maxSkew = 4,
  smooth = 0.08,
}: ScrollSkewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const currentSkew = useRef(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Start shared tracker if first instance
    listenerCount++
    if (listenerCount === 1) {
      cleanupTracking = startTracking() || null
    }

    let localRaf: number

    const tick = () => {
      const target = Math.max(-maxSkew, Math.min(maxSkew, scrollVelocity * 0.3))
      currentSkew.current += (target - currentSkew.current) * smooth

      if (wrapperRef.current) {
        // Only update DOM if skew is noticeable
        if (Math.abs(currentSkew.current) > 0.01) {
          wrapperRef.current.style.transform = `skewY(${currentSkew.current.toFixed(2)}deg)`
        }
      }

      localRaf = requestAnimationFrame(tick)
    }

    localRaf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(localRaf)
      listenerCount--
      if (listenerCount === 0 && cleanupTracking) {
        cleanupTracking()
        cleanupTracking = null
      }
    }
  }, [maxSkew, smooth])

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ willChange: "transform", transformOrigin: "center center" }}
    >
      {children}
    </div>
  )
}
