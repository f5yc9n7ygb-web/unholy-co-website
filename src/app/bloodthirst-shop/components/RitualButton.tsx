"use client"

import { motion } from "framer-motion"
import { useRef, useState } from "react"

/**
 * The CTA — feels like a signature, not a click.
 * Magnetic on hover (subtle), heartbeat halo, ink-draw underline.
 */
export function RitualButton({
  label,
  onClick,
  disabled,
  pending,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  pending?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) * 0.18
    const dy = (e.clientY - (r.top + r.height / 2)) * 0.18
    setPos({ x: dx, y: dy })
  }
  const handleLeave = () => setPos({ x: 0, y: 0 })

  return (
    <motion.button
      ref={ref}
      data-rune
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      disabled={disabled}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 240, damping: 18, mass: 0.6 }}
      whileTap={{ scale: 0.97 }}
      className="group relative inline-flex items-center justify-center overflow-hidden border border-blood/70 bg-blood px-12 py-5 text-sm font-bold uppercase tracking-[0.45em] text-offwhite transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        boxShadow:
          "0 0 0 1px rgba(176,0,32,0.4), 0 30px 80px -10px rgba(176,0,32,0.55), inset 0 0 30px rgba(0,0,0,0.4)",
      }}
    >
      {/* Heartbeat halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-12 z-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(closest-side, rgba(176,0,32,0.35), transparent 70%)",
          animation: "ritual-pulse 1.6s ease-in-out infinite",
        }}
      />

      {/* Ink-draw underline */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-1/2 z-0 h-px w-0 -translate-x-1/2 bg-offwhite transition-[width] duration-500 ease-out group-hover:w-[80%]"
      />

      <span className="relative z-10 flex items-center gap-3">
        {pending && (
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-offwhite" />
        )}
        {label}
      </span>

      <style jsx>{`
        @keyframes ritual-pulse {
          0%, 100% { transform: scale(0.9); opacity: 0.5; }
          50%      { transform: scale(1.04); opacity: 0.85; }
        }
      `}</style>
    </motion.button>
  )
}
