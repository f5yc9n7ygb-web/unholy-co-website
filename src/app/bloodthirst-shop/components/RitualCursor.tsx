"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Crosshair + sigil cursor for the BloodThirst shop ritual.
 *
 * - Crosshair tracks the mouse 1:1 (no smoothing — feels precise, not playful).
 * - On hover of a [data-rune] / button / link, swells into a circumscribed runic mark
 *   that rotates slowly.
 * - Hidden on touch devices.
 */
export function RitualCursor() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
    if (isTouch) return
    setEnabled(true)

    const move = (e: MouseEvent) => {
      if (!wrapRef.current) return
      wrapRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
    }

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest("a, button, [role='button'], input, textarea, select, [data-rune]")) {
        setHover(true)
      }
    }
    const onOut = () => setHover(false)
    const onLeave = () => setHidden(true)
    const onEnter = () => setHidden(false)

    window.addEventListener("mousemove", move, { passive: true })
    window.addEventListener("mouseover", onOver)
    window.addEventListener("mouseout", onOut)
    document.addEventListener("mouseleave", onLeave)
    document.addEventListener("mouseenter", onEnter)

    document.documentElement.style.cursor = "none"

    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseover", onOver)
      window.removeEventListener("mouseout", onOut)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("mouseenter", onEnter)
      document.documentElement.style.cursor = ""
    }
  }, [])

  if (!enabled) return null

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[200] mix-blend-difference will-change-transform"
      style={{ opacity: hidden ? 0 : 1, transition: "opacity 0.18s ease" }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        {/* crosshair — precise */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -50%) scale(${hover ? 0.4 : 1})`,
            transition: "transform 220ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div className="h-px w-3 bg-offwhite/85" />
          <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-offwhite/85" />
        </div>

        {/* sigil — appears on hover */}
        <svg
          viewBox="0 0 40 40"
          className="absolute left-1/2 top-1/2"
          style={{
            width: 36,
            height: 36,
            transform: `translate(-50%, -50%) scale(${hover ? 1 : 0.4}) rotate(${hover ? 360 : 0}deg)`,
            opacity: hover ? 1 : 0,
            transition: "transform 700ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease",
          }}
        >
          <circle cx="20" cy="20" r="18" fill="none" stroke="#F6F6F6" strokeWidth="0.6" />
          <circle cx="20" cy="20" r="11" fill="none" stroke="#F6F6F6" strokeWidth="0.4" />
          <path d="M20 4 L20 36 M4 20 L36 20" stroke="#F6F6F6" strokeWidth="0.5" />
          <path d="M9 9 L31 31 M31 9 L9 31" stroke="#F6F6F6" strokeWidth="0.3" opacity="0.6" />
          <circle cx="20" cy="20" r="1.6" fill="#B00020" />
        </svg>
      </div>
    </div>
  )
}
