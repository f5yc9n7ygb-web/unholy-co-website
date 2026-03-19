"use client"

import { useEffect, useState, FormEvent, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Marquee } from "@/components/ux/Marquee"

// ── CONFIG ────────────────────────────────────────────────────────────────────
// Update LAUNCH_DATE to your actual launch date before going live
const LAUNCH_DATE = new Date("2026-04-02T06:30:00.000Z") // Apr 2, 12:00 PM IST

// Update these to your real social handles
const SOCIALS = {
  instagram: "https://instagram.com/theunholyco",
  facebook:  "https://facebook.com/theunholyco",
  x:         "https://x.com/theunholyco",
}
// ─────────────────────────────────────────────────────────────────────────────

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }
type FormState = "idle" | "sending" | "success" | "error"

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days:    Math.floor(diff / 864e5),
    hours:   Math.floor((diff % 864e5) / 36e5),
    minutes: Math.floor((diff % 36e5)  / 6e4),
    seconds: Math.floor((diff % 6e4)   / 1e3),
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

// ── Countdown Unit ────────────────────────────────────────────────────────────
function CountdownUnit({ value, label }: { value: number; label: string }) {
  const prev = useRef(value)
  const [flip, setFlip] = useState(false)

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value
      setFlip(true)
      const t = setTimeout(() => setFlip(false), 300)
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative overflow-hidden">
        <motion.span
          key={value}
          initial={{ y: flip ? -20 : 0, opacity: flip ? 0 : 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="block font-cinzel text-[13vw] font-black leading-none tracking-tight text-offwhite tabular-nums sm:text-[8vw] md:text-[6.5vw] lg:text-[76px]"
        >
          {pad(value)}
        </motion.span>
        {/* Blood underline */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-blood/50" />
      </div>
      <span className="text-[8px] uppercase tracking-[0.45em] text-bone/30 md:text-[9px]">
        {label}
      </span>
    </div>
  )
}

// ── Separator ─────────────────────────────────────────────────────────────────
function Sep() {
  return (
    <span className="font-cinzel text-[10vw] font-black text-blood/40 leading-none self-start mt-2 sm:text-[6vw] md:text-[5vw] lg:text-[56px]">
      :
    </span>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TeaserClient() {
  const [ready, setReady]         = useState(false)
  const [timeLeft, setTimeLeft]   = useState<TimeLeft>(getTimeLeft(LAUNCH_DATE))
  const [email, setEmail]         = useState("")
  const [preorder, setPreorder]   = useState(false)
  const [honeypot, setHoneypot]   = useState("")
  const [formState, setFormState] = useState<FormState>("idle")

  // Entrance
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 280)
    return () => clearTimeout(t)
  }, [])

  // Countdown tick
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(LAUNCH_DATE)), 1000)
    return () => clearInterval(id)
  }, [])

  // Form submit
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || honeypot) return

    setFormState("sending")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: preorder ? "teaser-preorder" : "teaser",
          company: honeypot,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) throw new Error()
      setFormState("success")
      setEmail("")
    } catch {
      setFormState("error")
    }
  }

  // ── Shared entrance variants ─────────────────────────────────────────────
  const rise = (delay = 0) => ({
    initial:    { y: "105%", opacity: 0 },
    animate:    ready ? { y: 0, opacity: 1 } : {},
    transition: { duration: 1.05, delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  const fade = (delay = 0) => ({
    initial:    { opacity: 0 },
    animate:    ready ? { opacity: 1 } : {},
    transition: { duration: 0.9, delay },
  })

  return (
    <div className="relative">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — full viewport
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">

        {/* ── Ambient blood glow ── */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/[0.18] blur-[220px]" />
          <div className="absolute top-[38%] left-[58%] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/[0.09] blur-[140px]" />
          <div className="absolute top-[70%] left-[35%] h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/[0.07] blur-[100px]" />
        </div>

        {/* ── Ghosted can — large, behind the text ── */}
        <motion.div
          className="pointer-events-none absolute z-10 select-none"
          {...fade(0.15)}
          style={{ opacity: 0 }}
          animate={ready ? { opacity: 0.22 } : { opacity: 0 }}
          transition={{ duration: 1.8, delay: 0.15 }}
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Image
              src="/can.png"
              alt="BLOODTHIRST — coming soon"
              width={340}
              height={580}
              className="drop-shadow-[0_0_160px_rgba(176,0,32,0.65)]"
              priority
            />
          </motion.div>
        </motion.div>

        {/* ── Title + copy ── */}
        <div className="relative z-20 px-4 text-center">

          {/* Eyebrow */}
          <motion.p
            className="mb-8 text-[9px] uppercase tracking-[0.6em] text-blood/65 md:text-[10px]"
            {...fade(0.45)}
          >
            theunholy.co
          </motion.p>

          {/* Line 1 — SOMETHING */}
          <div className="overflow-hidden">
            <motion.h1
              className="font-cinzel text-[13vw] font-black uppercase leading-[0.88] tracking-[0.04em] text-offwhite/90 sm:text-[9.5vw] md:text-[7.5vw]"
              {...rise(0.55)}
            >
              SOMETHING
            </motion.h1>
          </div>

          {/* Line 2 — UNHOLY (blood) */}
          <div className="overflow-hidden">
            <motion.h1
              className="font-cinzel text-[13vw] font-black uppercase leading-[0.88] tracking-[0.04em] text-blood [text-shadow:0_0_70px_rgba(176,0,32,0.55)] sm:text-[9.5vw] md:text-[7.5vw]"
              {...rise(0.72)}
            >
              UNHOLY
            </motion.h1>
          </div>

          {/* Line 3 — IS COMING */}
          <div className="overflow-hidden">
            <motion.h1
              className="font-cinzel text-[13vw] font-black uppercase leading-[0.88] tracking-[0.04em] text-offwhite/90 sm:text-[9.5vw] md:text-[7.5vw]"
              {...rise(0.89)}
            >
              IS COMING
            </motion.h1>
          </div>

          {/* Tagline */}
          <motion.p
            className="mt-8 text-[10px] uppercase tracking-[0.45em] text-bone/35 md:text-xs"
            {...fade(1.3)}
          >
            Not your salvation &mdash; BLOODTHIRST
          </motion.p>
        </div>

        {/* ── Scroll indicator ── */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
          {...fade(1.8)}
        >
          <span className="text-[8px] uppercase tracking-[0.35em] text-bone/25">Scroll</span>
          <motion.div
            className="h-8 w-px bg-gradient-to-b from-bone/35 to-transparent"
            animate={{ scaleY: [1, 0.25, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* ── Marquee divider ── */}
      <div className="border-y border-white/[0.04] py-5 overflow-hidden">
        <Marquee speed={22} pauseOnHover={false}>
          {["BLOODTHIRST", "UNHOLY CO", "SOMETHING IS COMING", "EST. MMXXV", "NOT YOUR SALVATION", "FIRST BLOOD"].map((text) => (
            <span key={text} className="mx-8 flex shrink-0 items-center gap-8">
              <span className="whitespace-nowrap font-cinzel text-[10px] uppercase tracking-[0.35em] text-bone/12 md:text-xs">
                {text}
              </span>
              <span className="text-[10px] text-blood/20">&diams;</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          COUNTDOWN
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-28 md:py-40">

        {/* Bg glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-blood/[0.05] blur-[160px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <p className="mb-14 text-[9px] uppercase tracking-[0.55em] text-blood/55 md:text-[10px]">
            Drops In
          </p>

          {/* Countdown grid */}
          <div className="flex items-start justify-center gap-4 md:gap-10 lg:gap-14">
            <CountdownUnit value={timeLeft.days}    label="Days"    />
            <Sep />
            <CountdownUnit value={timeLeft.hours}   label="Hours"   />
            <Sep />
            <CountdownUnit value={timeLeft.minutes} label="Minutes" />
            <Sep />
            <CountdownUnit value={timeLeft.seconds} label="Seconds" />
          </div>

          <div className="mx-auto mt-16 h-px w-14 bg-blood/25" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SIGN UP — First Blood
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-28 md:py-40">

        {/* Gradients */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-blood/[0.07] to-transparent" />

        <div className="relative z-10 mx-auto max-w-lg px-4 text-center">

          <p className="mb-5 text-[9px] uppercase tracking-[0.55em] text-bone/35 md:text-[10px]">
            First Blood
          </p>

          <h2 className="font-cinzel text-3xl font-bold uppercase leading-tight tracking-wide text-offwhite md:text-4xl lg:text-5xl">
            Claim Your Place<br className="hidden sm:block" /> in the Ritual
          </h2>

          <p className="mx-auto mt-6 mb-10 max-w-sm text-sm leading-relaxed text-bone/40">
            First access. First drops. First blood. Before the ordinary even
            know what this is.
          </p>

          {/* ── Form / Success ── */}
          <AnimatePresence mode="wait">
            {formState === "success" ? (

              <motion.div
                key="success"
                className="py-10"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55 }}
              >
                <motion.div
                  className="mb-4 text-blood text-3xl select-none"
                  animate={{ scale: [0.8, 1.15, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  ✦
                </motion.div>
                <p className="font-cinzel text-xl font-semibold text-offwhite">
                  You&apos;re in the ritual.
                </p>
                <p className="mt-3 text-sm text-bone/40">
                  Check your inbox &amp; confirm to lock in your place.
                </p>
              </motion.div>

            ) : (

              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Honeypot */}
                <input
                  name="company"
                  tabIndex={-1}
                  aria-hidden
                  autoComplete="off"
                  className="absolute left-[-9999px] h-px w-px opacity-0"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />

                {/* Email row */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (formState === "error") setFormState("idle")
                    }}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3.5 text-sm text-offwhite placeholder:text-bone/22 outline-none backdrop-blur-sm transition-colors hover:bg-white/[0.06] focus:border-blood/50 focus:ring-1 focus:ring-blood/30"
                  />
                  <button
                    type="submit"
                    disabled={formState === "sending"}
                    className="btn btn-primary whitespace-nowrap px-8"
                  >
                    {formState === "sending" ? "…" : "Join the Cult"}
                  </button>
                </div>

                {/* Preorder interest */}
                <label className="flex cursor-pointer items-center justify-center gap-3 group select-none">
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      preorder
                        ? "border-blood bg-blood/20"
                        : "border-white/15 bg-transparent"
                    }`}
                    onClick={() => setPreorder((v) => !v)}
                  >
                    {preorder && (
                      <svg className="h-3 w-3 text-blood" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10.5 2L5 8.5 2 5.5 1 6.5l4 4 6.5-7.5z" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={preorder}
                    onChange={(e) => setPreorder(e.target.checked)}
                  />
                  <span className="text-xs text-bone/35 transition-colors group-hover:text-bone/55">
                    I want to preorder when it launches
                  </span>
                </label>

                {formState === "error" && (
                  <p className="text-sm text-blood/70">
                    Something went wrong. Try again.
                  </p>
                )}
              </motion.form>

            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Second marquee divider ── */}
      <div className="border-y border-white/[0.03] py-5 overflow-hidden">
        <Marquee speed={30} pauseOnHover={false}>
          {["UNHOLY CO", "MINERAL WATER", "GOTHIC PREMIUM", "FORGED FOR THE FEW", "RITUAL GRADE HYDRATION", "NOT FOR EVERYONE"].map((text) => (
            <span key={text} className="mx-8 flex shrink-0 items-center gap-8">
              <span className="text-blood/15 text-[10px]">✦</span>
              <span className="whitespace-nowrap font-cinzel text-[10px] uppercase tracking-[0.35em] text-bone/10 md:text-xs">
                {text}
              </span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CLOSE — minimal social + brand mark
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden py-20 pb-28">

        {/* Blood glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-[280px] w-[500px] -translate-x-1/2 rounded-full bg-blood/[0.05] blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8">

          {/* Blood diamond */}
          <div className="flex items-center gap-4">
            <div className="h-px w-16 bg-blood/20" />
            <span className="text-blood/40 text-xs">✦</span>
            <div className="h-px w-16 bg-blood/20" />
          </div>

          {/* Social links */}
          <div className="flex items-center gap-8">
            <a
              href={SOCIALS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-bone/22 transition-colors hover:text-blood"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
              </svg>
            </a>

            <a
              href={SOCIALS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-bone/22 transition-colors hover:text-blood"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
            </a>

            <a
              href={SOCIALS.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X / Twitter"
              className="text-bone/22 transition-colors hover:text-blood"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.265 5.633 5.9-5.633Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          {/* Brand mark */}
          <p className="text-[8px] uppercase tracking-[0.6em] text-bone/16 md:text-[9px]">
            theunholy.co &mdash; Est. MMXXV
          </p>

        </div>
      </section>

    </div>
  )
}
