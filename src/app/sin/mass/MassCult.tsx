"use client"

import { useState } from "react"
import { MASS_CULT } from "@/content/sin-mass"
import { Slam, Stamp } from "./theme"

/**
 * JOIN THE CULT — the second conversion path. Catches the visitor who won't
 * buy today; posts to the existing double-opt-in /api/subscribe (honeypot +
 * rate-limited server-side) with source "sin". Sits between the final slab
 * and the footer: last thing before they leave.
 */
type CultState = "idle" | "pending" | "done" | "error"

export function MassCult() {
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("") // honeypot — humans never see it
  const [state, setState] = useState<CultState>("idle")

  const submit = async () => {
    const value = email.trim()
    if (!value || state === "pending" || state === "done") return
    setState("pending")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, website, source: "sin" }),
      })
      const data = await res.json().catch(() => null)
      setState(res.ok && data?.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }

  return (
    <section className="relative border-t-2 border-blood/40 bg-[#050505] px-4 py-14 md:px-10 md:py-20">
      <Slam>
        <div className="mx-auto w-full max-w-2xl text-center">
          <Stamp tone="ink" rotate={-2}>
            {MASS_CULT.stamp}
          </Stamp>
          <h2 className="mt-4 font-anton text-4xl uppercase leading-none tracking-[0.02em] text-offwhite md:text-6xl">
            {MASS_CULT.title}
          </h2>
          <p className="mx-auto mt-3 max-w-md font-mono text-xs leading-relaxed text-bone/65">
            {MASS_CULT.sub}
          </p>

          {state === "done" ? (
            <p
              role="status"
              className="mx-auto mt-6 max-w-md border-2 border-blood bg-blood/[0.08] px-5 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-offwhite"
            >
              {MASS_CULT.success}
            </p>
          ) : (
            <form
              className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              {/* honeypot — hidden from humans, tempting to bots */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />
              <label htmlFor="cult-email" className="sr-only">
                Email address
              </label>
              <input
                id="cult-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (state === "error") setState("idle")
                }}
                placeholder={MASS_CULT.placeholder}
                className="min-w-0 flex-1 border-2 border-offwhite/20 bg-[#0d0d0d] px-4 py-3.5 font-mono text-sm font-bold tracking-wider text-offwhite placeholder:font-normal placeholder:text-bone/40 outline-none transition-colors duration-150 focus:border-blood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offwhite"
              />
              <button
                type="submit"
                disabled={state === "pending"}
                className="shrink-0 border-2 border-offwhite bg-blood px-6 py-3.5 font-anton text-lg uppercase tracking-[0.08em] text-offwhite shadow-[4px_4px_0_#F6F6F6] transition-[transform,box-shadow] duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#F6F6F6] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offwhite"
              >
                {state === "pending" ? MASS_CULT.pending : MASS_CULT.cta}
              </button>
            </form>
          )}

          {state === "error" && (
            <p role="alert" className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blood">
              {MASS_CULT.error}
            </p>
          )}
        </div>
      </Slam>
    </section>
  )
}
