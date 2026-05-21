"use client"

import { motion } from "framer-motion"
import type { Pack } from "@/lib/shop/catalog"
import type { ShippingForm } from "@/lib/shop/types"
import { CLOSE } from "@/content/bloodthirst"

/**
 * Phase 5 — CLOSE.
 *
 * Plays after Razorpay verifies the payment. Wax-seal stamp via SVG path-draw,
 * then a gothic order summary in brand voice. After 6s of idle the user is
 * navigated to /thanks?receipt=... — or they can click through earlier.
 */
export function PhaseClose({
  selected,
  form,
  total,
  onContinue,
}: {
  selected: Pack
  form: ShippingForm
  total: number
  onContinue: () => void
}) {
  return (
    <section
      data-phase="close"
      className="relative flex min-h-screen w-full items-center px-6 py-24"
    >
      <div className="mx-auto w-full max-w-3xl text-center">
        {/* WAX SEAL — SVG path draw */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-8 h-28 w-28 md:h-32 md:w-32"
        >
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <defs>
              <radialGradient id="wax" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#E63956" />
                <stop offset="60%" stopColor="#B00020" />
                <stop offset="100%" stopColor="#5a000f" />
              </radialGradient>
            </defs>
            <motion.circle
              cx="60"
              cy="60"
              r="48"
              fill="url(#wax)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "backOut" }}
              style={{ transformOrigin: "60px 60px" }}
            />
            <motion.circle
              cx="60"
              cy="60"
              r="40"
              fill="none"
              stroke="#F6F6F6"
              strokeWidth="0.6"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.55 }}
            />
            {/* sigil bones — concentric crosshair + diagonals */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              stroke="#F6F6F6"
              strokeWidth="0.8"
              strokeLinecap="round"
            >
              <line x1="60" y1="28" x2="60" y2="92" />
              <line x1="28" y1="60" x2="92" y2="60" />
              <line x1="38" y1="38" x2="82" y2="82" opacity="0.55" />
              <line x1="82" y1="38" x2="38" y2="82" opacity="0.55" />
              <circle cx="60" cy="60" r="4" fill="#F6F6F6" />
            </motion.g>
            <motion.text
              x="60"
              y="64"
              textAnchor="middle"
              fontFamily="var(--font-cinzel), Georgia, serif"
              fontWeight="900"
              fontSize="9"
              fill="#0a0a0a"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.2 }}
              letterSpacing="2"
            >
              {CLOSE.stamp}
            </motion.text>
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="font-cinzel text-[clamp(2rem,5.5vw,4rem)] font-black uppercase leading-[0.95] tracking-[-0.005em] text-offwhite"
        >
          {CLOSE.welcome}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-bone/65 md:text-lg"
        >
          {CLOSE.body}
        </motion.p>

        {/* SUMMARY */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="mx-auto mt-12 max-w-2xl border border-bone/15 bg-black/55 p-6 text-left backdrop-blur-md md:p-8"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood/70">
            Order summary
          </p>

          <div className="mt-5 grid gap-1 font-mono text-sm">
            <Row label="Pack" value={`${selected.title} · ${selected.qty} cans`} />
            <Row label="Total" value={`₹${total.toLocaleString("en-IN")}`} accent />
            <Row label="To" value={form.name || "—"} />
            <Row
              label="Address"
              value={
                [form.address, form.city, form.state, form.pincode]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
              compact
            />
            {form.gstNumber && (
              <Row label="GST" value={`${form.gstNumber}${form.gstBusinessName ? ` · ${form.gstBusinessName}` : ""}`} />
            )}
          </div>

          <div className="my-7 h-px w-full bg-bone/12" />

          <div className="grid gap-4 sm:grid-cols-3">
            {CLOSE.seals.map((s) => (
              <div key={s.label} data-rune className="border border-bone/15 bg-black/40 p-4">
                <p className="font-cinzel text-xs font-black uppercase tracking-[0.35em] text-blood">
                  {s.label}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-bone/55">
                  {s.sub}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              data-rune
              onClick={onContinue}
              className="group relative inline-flex items-center gap-3 border border-bone/30 bg-transparent px-8 py-3 font-mono text-[11px] uppercase tracking-[0.4em] text-offwhite transition-colors duration-300 hover:border-blood/70"
            >
              <span>{CLOSE.cta}</span>
              <span className="inline-block h-px w-6 bg-bone/45 transition-all duration-300 group-hover:w-10 group-hover:bg-blood" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Row({
  label,
  value,
  accent,
  compact,
}: {
  label: string
  value: string
  accent?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={`grid grid-cols-[110px,1fr] items-baseline gap-3 ${
        compact ? "py-1" : "py-1.5"
      }`}
    >
      <span className="text-[10px] uppercase tracking-[0.3em] text-bone/45">
        {label}
      </span>
      <span
        className={`tabular-nums ${
          accent ? "font-cinzel text-2xl font-black text-offwhite" : "text-offwhite/85"
        }`}
      >
        {value}
      </span>
    </div>
  )
}
