"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * Scroll-reveal primitive for the "Cold Light" overhaul. As a section enters
 * the viewport it fades + lifts into place, turning the previously-static
 * down-page scroll into choreography.
 *
 * Deliberately zero-dependency: one IntersectionObserver + CSS transitions, no
 * GSAP / Framer / Lenis (the page's whole performance thesis). Respects
 * `prefers-reduced-motion` by revealing instantly, and reveals instantly if IO
 * is unavailable so content can never get stuck hidden.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 18,
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  /** Stagger, in ms — pass increasing values to siblings for a cascade. */
  delay?: number
  /** Travel distance in px. */
  y?: number
  as?: "div" | "section" | "li" | "article"
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const Comp = Tag as any
  return (
    <Comp
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: shown ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </Comp>
  )
}
