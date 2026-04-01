"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"

type FormState = "idle" | "loading" | "success" | "error"

const REASONS = [
  "Damaged on arrival",
  "Wrong product received",
  "Quality issue / defective product",
]

const fadeUp = (delay = 0) => ({
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export function RefundClient() {
  const [orderId, setOrderId] = useState("")
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [state, setState] = useState<FormState>("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orderId.trim() || !email.trim() || !reason || !details.trim()) return

    setState("loading")
    setError("")

    try {
      const res = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          email: email.trim(),
          reason,
          details: details.trim(),
        }),
      })

      const data = await res.json()

      if (!data.ok) {
        setState("error")
        setError(data.error || "Unable to submit the request.")
        return
      }

      setState("success")
    } catch {
      setState("error")
      setError("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="relative min-h-[90vh] overflow-hidden">
      {/* Ghost background text */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
      >
        <span className="font-cinzel text-[20vw] font-black leading-none text-bone/[0.03]">
          RETURN
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-28 md:py-36">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="text-center">
          <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/60">
            Refunds & returns
          </p>
          <h1 className="font-cinzel text-3xl font-bold text-offwhite md:text-4xl">
            Request a refund.
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bone/40">
            We stand behind our product. If something arrived damaged or defective, we&apos;ll make it right.
          </p>
        </motion.div>

        {/* Policy notice */}
        <motion.div {...fadeUp(0.08)} className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 space-y-2.5">
          <p className="text-[10px] uppercase tracking-[0.4em] text-blood/60">Refund policy</p>
          <ul className="space-y-1.5 text-xs text-bone/45 leading-relaxed">
            <li className="flex gap-2"><span className="text-blood/60 mt-0.5">✓</span><span>Product arrived damaged or leaking</span></li>
            <li className="flex gap-2"><span className="text-blood/60 mt-0.5">✓</span><span>Wrong item shipped</span></li>
            <li className="flex gap-2"><span className="text-blood/60 mt-0.5">✓</span><span>Defective product (seal breach, off-quality)</span></li>
          </ul>
          <div className="border-t border-white/[0.05] pt-2.5">
            <ul className="space-y-1.5 text-xs text-bone/30 leading-relaxed">
              <li className="flex gap-2"><span className="mt-0.5">✗</span><span>Change of mind or taste preference</span></li>
              <li className="flex gap-2"><span className="mt-0.5">✗</span><span>Shipping delays (contact your courier)</span></li>
            </ul>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {state === "success" ? (
            <motion.div
              key="success"
              {...fadeUp(0)}
              className="mt-10 text-center"
            >
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blood/30 bg-blood/10">
                  <svg className="h-7 w-7 text-blood" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="font-cinzel text-2xl font-bold text-offwhite">Request submitted.</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-bone/45 leading-relaxed">
                We&apos;ve received your refund request. Check your email for confirmation.
                Our team will review and respond within 24–48 hours.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <TransitionLink href="/track" className="btn btn-ghost px-6 py-3 text-sm">
                  Track Your Order
                </TransitionLink>
                <TransitionLink href="/" className="btn btn-ghost px-6 py-3 text-sm">
                  Return Home
                </TransitionLink>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              {...fadeUp(0.1)}
              onSubmit={handleSubmit}
              className="mt-10 space-y-5"
            >
              {/* Order ID */}
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.3em] text-bone/40">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="From your confirmation email"
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-black/50 px-4 py-3.5 text-sm text-offwhite placeholder:text-bone/25 outline-none transition-colors focus:border-blood/40 focus:ring-1 focus:ring-blood/20"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.3em] text-bone/40">
                  Email used at checkout
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-black/50 px-4 py-3.5 text-sm text-offwhite placeholder:text-bone/25 outline-none transition-colors focus:border-blood/40 focus:ring-1 focus:ring-blood/20"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.3em] text-bone/40">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-black/50 px-4 py-3.5 text-sm text-offwhite outline-none transition-colors focus:border-blood/40 focus:ring-1 focus:ring-blood/20 appearance-none"
                >
                  <option value="" disabled className="bg-black text-bone/40">Select a reason</option>
                  {REASONS.map((r) => (
                    <option key={r} value={r} className="bg-black text-offwhite">{r}</option>
                  ))}
                </select>
              </div>

              {/* Details */}
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.3em] text-bone/40">
                  Describe the issue
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe what happened. Include photo evidence if possible — attach images to the email confirmation you'll receive."
                  rows={4}
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-black/50 px-4 py-3.5 text-sm text-offwhite placeholder:text-bone/25 outline-none transition-colors focus:border-blood/40 focus:ring-1 focus:ring-blood/20 resize-none"
                />
              </div>

              {/* Error */}
              {state === "error" && (
                <div className="rounded-xl border border-blood/20 bg-blood/[0.06] px-4 py-3 text-sm text-bone/60">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={state === "loading" || !orderId.trim() || !email.trim() || !reason || !details.trim()}
                className="w-full rounded-lg bg-blood py-4 text-sm font-semibold uppercase tracking-wider text-white transition-all hover:bg-blood/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {state === "loading" ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "Submit Refund Request"
                )}
              </button>

              {/* Policy note */}
              <p className="text-center text-[11px] text-bone/25 leading-relaxed">
                Refunds are only issued for damaged, defective, or incorrect orders.
                Approved refunds are processed within 5–7 business days to your original payment method.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
