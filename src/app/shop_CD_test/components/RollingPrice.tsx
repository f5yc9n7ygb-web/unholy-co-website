"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Rolls an integer from the previous value to the new value with easing.
 * Used for price displays. Respects prefers-reduced-motion.
 */
export function RollingPrice({
  value,
  duration = 520,
  className,
  prefix = "",
  locale = "en-IN",
}: {
  value: number
  duration?: number
  className?: string
  prefix?: string
  locale?: string
}) {
  const [displayed, setDisplayed] = useState(value)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReduced = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReduced || value === displayed) {
      setDisplayed(value)
      return
    }

    fromRef.current = displayed
    startRef.current = null

    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const elapsed = t - startRef.current
      const p = Math.min(1, elapsed / duration)
      // easeOutExpo for a premium "settle" feel
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      const next = Math.round(fromRef.current + (value - fromRef.current) * eased)
      setDisplayed(next)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}{displayed.toLocaleString(locale)}
    </span>
  )
}
