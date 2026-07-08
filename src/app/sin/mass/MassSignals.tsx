"use client"

import { useEffect } from "react"
import { trackPixelCustom } from "@/lib/meta-pixel"

/**
 * Funnel visibility for an 8-screen page: fires ONE Meta custom event per
 * section the visitor actually reaches, so ad reporting can show where cold
 * traffic bails. Renders nothing; IntersectionObserver only; each section
 * fires once per pageview. Purchase/checkout events stay in the hook — this
 * is scroll telemetry only.
 */
const SECTIONS = [
  "sin-hero",
  "sin-object",
  "sin-buy",
  "sin-why",
  "sin-proof",
  "sin-versus",
  "sin-faq",
  "sin-vault",
  "sin-final",
] as const

export function MassSignals() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const seen = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          if (!entry.isIntersecting || seen.has(id)) continue
          seen.add(id)
          trackPixelCustom("SinSectionView", {
            section: id.replace("sin-", ""),
            page: window.location.pathname,
          })
          io.unobserve(entry.target)
        }
      },
      { threshold: 0.25 }
    )
    for (const id of SECTIONS) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  return null
}
