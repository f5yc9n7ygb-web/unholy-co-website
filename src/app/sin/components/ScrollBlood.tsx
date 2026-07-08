"use client"

import { useEffect, useRef } from "react"

/**
 * Blood scroll-progress hairline — a 2px seam pinned to the very top of the
 * viewport that fills left→right as the page is read. Gives a long cold-traffic
 * scroll a sense of forward motion (and quietly says "the end is near, commit").
 *
 * Zero-dependency, rAF-throttled, writes transform directly to the node so
 * scrolling never re-renders React. Scroll-linked position rather than
 * animation, so it stays honest under prefers-reduced-motion.
 */
export function ScrollBlood() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    let raf = 0

    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      bar.style.transform = `scaleX(${p})`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[65] h-[2px] bg-blood/90 shadow-[0_0_8px_rgba(176,0,32,0.6)]"
      ref={barRef}
      style={{ transform: "scaleX(0)", transformOrigin: "left" }}
    />
  )
}
