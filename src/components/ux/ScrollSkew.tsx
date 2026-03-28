"use client"

import { useEffect, useRef } from "react"

/*
  ScrollSkew — applies a skewY transform based on scroll velocity.
  Optimized: uses a single RAF loop shared across all instances
  via a module-level velocity tracker.
*/

// Module-level shared velocity tracker (one RAF for all ScrollSkew instances)
const tracker = {
  velocity: 0,
  lastScrollY: 0,
  listenerCount: 0,
  rafId: null as number | null,
  cleanup: null as (() => void) | null,
}

function startTracking() {
  if (tracker.rafId !== null) return

  const onScroll = () => {
    const current = window.scrollY
    tracker.velocity = current - tracker.lastScrollY
    tracker.lastScrollY = current
  }

  const tick = () => {
    tracker.velocity *= 0.92 // decay
    tracker.rafId = requestAnimationFrame(tick)
  }

  window.addEventListener("scroll", onScroll, { passive: true })
  tracker.lastScrollY = window.scrollY
  tracker.rafId = requestAnimationFrame(tick)

  tracker.cleanup = () => {
    window.removeEventListener("scroll", onScroll)
    if (tracker.rafId !== null) cancelAnimationFrame(tracker.rafId)
    tracker.rafId = null
    tracker.velocity = 0
    tracker.lastScrollY = 0
    tracker.cleanup = null
  }
}

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
    tracker.listenerCount++
    if (tracker.listenerCount === 1) {
      startTracking()
    }

    let localRaf: number

    const tick = () => {
      const target = Math.max(-maxSkew, Math.min(maxSkew, tracker.velocity * 0.3))
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
      tracker.listenerCount--
      if (tracker.listenerCount === 0 && tracker.cleanup) {
        tracker.cleanup()
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
