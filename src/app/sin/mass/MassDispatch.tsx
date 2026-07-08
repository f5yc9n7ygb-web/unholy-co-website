"use client"

import { useEffect, useState } from "react"
import { MASS_DISPATCH } from "@/content/sin-mass"

/**
 * Live IST courier-cutoff countdown — the RED MASS urgency unit. Honest and
 * time-based only; never a stock or sales counter (brand rule). Computed in
 * Asia/Kolkata so every visitor sees the same clock; renders a stable shell
 * until mounted so SSR/CSR markup can't diverge.
 */
function useCutoff(): { open: boolean; remaining: string } | null {
  const [state, setState] = useState<{ open: boolean; remaining: string } | null>(null)

  useEffect(() => {
    const tick = () => {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      )
      const cutoff = new Date(now)
      cutoff.setHours(MASS_DISPATCH.cutoffHour, 0, 0, 0)
      if (now.getTime() >= cutoff.getTime()) {
        setState((prev) => (prev && !prev.open ? prev : { open: false, remaining: "" }))
        return
      }
      const ms = cutoff.getTime() - now.getTime()
      const h = Math.floor(ms / 3_600_000)
      const m = Math.floor((ms % 3_600_000) / 60_000)
      const s = Math.floor((ms % 60_000) / 1000)
      const remaining =
        h > 0
          ? `${h}H ${String(m).padStart(2, "0")}M`
          : `${m}M ${String(s).padStart(2, "0")}S`
      setState((prev) =>
        prev?.open && prev.remaining === remaining ? prev : { open: true, remaining }
      )
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return state
}

export function MassDispatch({
  onBlood = false,
  className = "",
}: {
  /** true when rendered on a blood-red background (flips to ink colors) */
  onBlood?: boolean
  className?: string
}) {
  const state = useCutoff()
  const open = state?.open ?? true
  const label = open ? MASS_DISPATCH.beforeLabel : MASS_DISPATCH.afterLabel
  const detail = !state
    ? ""
    : open
    ? `${MASS_DISPATCH.beforePrefix} ${state.remaining}`
    : MASS_DISPATCH.afterNote

  const ink = onBlood ? "text-[#050505]" : "text-offwhite"
  const dim = onBlood ? "text-[#050505]/70" : "text-bone/60"
  const dot = onBlood ? "bg-[#050505]" : "bg-blood"

  return (
    <span
      aria-live="polite"
      className={`inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] md:text-[11px] ${className}`}
    >
      <span
        aria-hidden
        className={`inline-block h-2 w-2 shrink-0 ${dot}`}
        style={{ animation: open ? "mass-blink 1.2s steps(1) infinite" : undefined }}
      />
      <span className={ink}>{label}</span>
      {detail && (
        <>
          <span aria-hidden className={dim}>
            —
          </span>
          <span className={`tabular-nums ${dim}`}>{detail}</span>
        </>
      )}
    </span>
  )
}
