"use client"

import { useEffect, useState } from "react"
import { SIN_DISPATCH } from "@/content/sin"

/**
 * Honest urgency for warehoused inventory: a live countdown to today's courier
 * cutoff (IST), never a stock or buyer count. Before the cutoff it nudges
 * "order now to ship today"; after, it flips to the next dispatch window.
 * Computed in Asia/Kolkata so it's correct regardless of the visitor's timezone,
 * and renders a static shell until mounted to avoid any hydration mismatch.
 */
function istNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
}

type DispatchState = { open: boolean; remaining: string }

function useDispatchState(): DispatchState | null {
  const [state, setState] = useState<DispatchState | null>(null)

  useEffect(() => {
    const tick = () => {
      const now = istNow()
      const cutoff = new Date(now)
      cutoff.setHours(SIN_DISPATCH.cutoffHour, 0, 0, 0)
      if (now.getTime() >= cutoff.getTime()) {
        setState({ open: false, remaining: "" })
        return
      }
      const ms = cutoff.getTime() - now.getTime()
      const h = Math.floor(ms / 3_600_000)
      const m = Math.floor((ms % 3_600_000) / 60_000)
      const s = Math.floor((ms % 60_000) / 1000)
      const remaining =
        h > 0
          ? `${h}h ${String(m).padStart(2, "0")}m`
          : `${m}m ${String(s).padStart(2, "0")}s`
      // Only commit when the rendered string actually changes (above the hour
      // mark it flips once a minute) — spares a per-second re-render.
      setState((prev) =>
        prev?.open === true && prev.remaining === remaining ? prev : { open: true, remaining }
      )
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return state
}

export function SinDispatch({
  compact = false,
  className = "",
}: {
  compact?: boolean
  className?: string
}) {
  const state = useDispatchState()

  // Pre-mount shell: show the label only, no time — keeps SSR/CSR markup stable.
  const open = state?.open ?? true
  const label = open ? SIN_DISPATCH.beforeLabel : SIN_DISPATCH.afterLabel
  const note = !state
    ? ""
    : open
    ? `order in ${state.remaining}`
    : "joins tomorrow's dispatch"

  return (
    <span
      className={`inline-flex items-center gap-2.5 font-mono uppercase tracking-[0.24em] ${
        compact ? "text-[9px]" : "text-[10px]"
      } ${className}`}
      aria-live="polite"
    >
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
          open ? "animate-pulse bg-blood" : "bg-bone/40"
        }`}
      />
      <span className={open ? "text-blood/90" : "text-bone/55"}>{label}</span>
      {note && (
        <>
          <span aria-hidden className="text-bone/30">·</span>
          <span className="tabular-nums text-bone/60">{note}</span>
        </>
      )}
    </span>
  )
}
