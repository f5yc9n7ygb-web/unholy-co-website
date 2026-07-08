"use client"

import { useEffect, useRef, useState } from "react"
import { MASS_BUY } from "@/content/sin-mass"

/**
 * Pincode serviceability check — personalises the generic 3–7 day promise
 * ("DELIVERS TO JAIPUR, RAJASTHAN") using the existing /api/pincode/lookup.
 * Purely additive engagement: the ETA copy stays the honest range, and a
 * failed lookup still reassures (we ship India-wide). Styled for the red slab.
 */
type PinState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "hit"; city: string; state: string }
  | { status: "miss" }

export function MassPincode() {
  const [pin, setPin] = useState("")
  const [state, setState] = useState<PinState>({ status: "idle" })
  const requestId = useRef(0)

  useEffect(() => {
    requestId.current += 1
    if (!/^\d{6}$/.test(pin)) {
      setState({ status: "idle" })
      return
    }
    const id = requestId.current
    const controller = new AbortController()
    setState({ status: "checking" })
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/pincode/lookup?pincode=${pin}`, {
          signal: controller.signal,
        })
        const data = await res.json().catch(() => null)
        if (id !== requestId.current) return
        if (res.ok && data?.ok && data.city && data.state) {
          setState({ status: "hit", city: String(data.city), state: String(data.state) })
        } else {
          setState({ status: "miss" })
        }
      } catch {
        if (id === requestId.current) setState({ status: "miss" })
      }
    }, 300)
    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [pin])

  const result =
    state.status === "checking"
      ? MASS_BUY.pinChecking
      : state.status === "hit"
      ? MASS_BUY.pinHit.replace("%CITY%", state.city.toUpperCase()).replace(
          "%STATE%",
          state.state.toUpperCase()
        )
      : state.status === "miss"
      ? MASS_BUY.pinMiss
      : ""

  return (
    <div className="border-t-2 border-[#050505]/25 pt-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label
          htmlFor="mass-pincode"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#050505]"
        >
          {MASS_BUY.pinLabel}
        </label>
        <input
          id="mass-pincode"
          type="text"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder={MASS_BUY.pinPlaceholder}
          className="w-44 border-2 border-[#050505] bg-transparent px-3 py-2.5 font-mono text-sm font-bold tracking-[0.14em] text-[#050505] placeholder:font-normal placeholder:text-[#050505]/50 outline-none transition-colors duration-150 focus:bg-[#050505]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]"
        />
      </div>
      {result && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${
            state.status === "hit" ? "text-[#050505]" : "text-[#050505]/70"
          }`}
        >
          {state.status === "hit" && (
            <span aria-hidden className="mr-2">
              ✓
            </span>
          )}
          {result}
        </p>
      )}
    </div>
  )
}
