"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { usePostHog } from "posthog-js/react"
import { TransitionLink } from "@/components/ux/TransitionLink"
import { trackPixel } from "@/lib/meta-pixel"

type ReceiptSummary = {
  packId: string
  qty: number
  orderId?: string
  packTitle?: string
  price?: number
  shippingName?: string
  shippingCity?: string
  shippingState?: string
} | null

const steps = [
  { num: "01", title: "Confirmation", desc: "Email with your order details within minutes." },
  { num: "02", title: "Dispatch", desc: "Packed and handed to courier within 24–48 hours." },
  { num: "03", title: "Track & Deliver", desc: "Track your order anytime at theunholy.co/track." },
]

// No opacity in initial states — page-transition-content CSS handles the fade.
// Framer Motion only drives the subtle transforms.
const fadeUp = (delay = 0) => ({
  initial: { y: 16 },
  animate: { y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export function ThanksContent({ receipt }: { receipt: ReceiptSummary }) {
  const isVerified = Boolean(receipt)
  const qtyLabel = receipt ? `${receipt.qty} cans` : null
  const posthog = usePostHog()

  useEffect(() => {
    if (!isVerified || !receipt) return

    // Guard: only fire conversion events once per orderId. The thanks page can
    // be reloaded, revisited via email link, or restored from bfcache — each
    // mount would otherwise re-fire Purchase, inflating Meta/PostHog counts.
    // Fallback to packId+qty when orderId is missing (verified pre-webhook).
    const dedupKey = receipt.orderId || `${receipt.packId}-${receipt.qty}-${receipt.price ?? ""}`
    const storageKey = `unholy_purchase_fired_${dedupKey}`
    try {
      if (localStorage.getItem(storageKey)) return
      localStorage.setItem(storageKey, String(Date.now()))
    } catch {
      // localStorage unavailable (private mode, quota) — fall through and fire.
      // A duplicate in that edge case is better than silently dropping a real
      // conversion for a user who genuinely can't persist state.
    }

    posthog?.capture("order_completed", {
      pack_id: receipt.packId,
      quantity: receipt.qty,
    })
    // Meta Pixel Purchase — orderId doubles as eventID for future CAPI dedup.
    trackPixel(
      "Purchase",
      {
        value: receipt.price,
        currency: "INR",
        content_ids: [receipt.packId],
        content_name: receipt.packTitle,
        content_type: "product",
        num_items: receipt.qty,
        contents: [{ id: receipt.packId, quantity: 1, item_price: receipt.price }],
      },
      receipt.orderId,
    )
  }, [isVerified, receipt, posthog])

  return (
    <div className="relative min-h-[90vh] overflow-hidden">
      {/* Ghost background text */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
      >
        <span className={`font-cinzel font-black leading-none ${isVerified ? "text-[22vw] text-bone/[0.045]" : "text-[28vw] text-blood/[0.12]"}`}>
          {isVerified ? "YOURS" : "WAIT"}
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-32 md:py-40">

        {/* ── Icon ── */}
        <motion.div {...fadeUp(0)} className="mb-10 flex justify-center">
          {isVerified ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blood/30 bg-blood/10 shadow-[0_0_48px_rgba(176,0,32,0.25)]">
              <svg className="h-7 w-7 text-blood" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-bone/10 bg-bone/5">
              <svg className="h-7 w-7 text-bone/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
          )}
        </motion.div>

        {/* ── Headline ── */}
        <motion.div {...fadeUp(0.08)} className="text-center">
          <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/60">
            {isVerified ? "Order confirmed" : "Pending verification"}
          </p>
          <h1 className="font-cinzel text-4xl font-bold text-offwhite md:text-5xl lg:text-6xl">
            {isVerified ? "The ritual is complete." : "Awaiting confirmation."}
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-bone/45 md:text-base">
            {isVerified
              ? "Your BloodThirst is on its way. Confirmation and tracking details will land in your inbox shortly."
              : "We couldn't verify this payment session. If you were charged, contact us and we’ll investigate."}
          </p>
        </motion.div>

        {/* ── Unverified warning ── */}
        {!isVerified && (
          <motion.div
            {...fadeUp(0.15)}
            className="mt-8 rounded-xl border border-blood/20 bg-blood/[0.06] px-5 py-4 text-sm text-bone/60"
          >
            If you completed payment and landed here, reach out via{" "}
            <TransitionLink href="/contact" className="text-blood/70 underline underline-offset-2 hover:text-blood">
              contact
            </TransitionLink>{" "}
            and we&apos;ll sort it immediately.
          </motion.div>
        )}

        {/* ── Order details ── */}
        {receipt && (
          <motion.div {...fadeUp(0.16)} className="mt-12">
            <p className="mb-1 text-[10px] uppercase tracking-[0.4em] text-bone/30">Order details</p>
            <div className="mt-4">
              <div className="h-px bg-blood/[0.12]" />
              {([
                receipt.orderId && { label: "Order ID", value: receipt.orderId, mono: true },
                receipt.packTitle && { label: "Product", value: receipt.packTitle, mono: false },
                { label: "Quantity", value: `${receipt.qty} cans`, mono: false },
                receipt.price && { label: "Amount Paid", value: `₹${receipt.price.toLocaleString("en-IN")}`, mono: false },
                receipt.shippingName && { label: "Delivering To", value: [receipt.shippingName, receipt.shippingCity, receipt.shippingState].filter(Boolean).join(", "), mono: false },
              ].filter(Boolean) as Array<{ label: string; value: string; mono: boolean }>)
                .map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between py-4">
                      <span className="text-xs uppercase tracking-widest text-bone/35">
                        {row.label}
                      </span>
                      <span className={`text-sm text-bone/70 ${row.mono ? "font-mono text-xs" : ""}`}>
                        {row.value}
                      </span>
                    </div>
                    <div className="h-px bg-blood/[0.08]" />
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* ── What happens next ── */}
        {isVerified && (
          <motion.div {...fadeUp(0.22)} className="mt-12">
            <p className="mb-1 text-[10px] uppercase tracking-[0.4em] text-bone/30">What happens next</p>
            <div className="mt-4">
              <div className="h-px bg-blood/[0.12]" />
              {steps.map((step, i) => (
                <motion.div key={step.num} {...fadeUp(0.28 + i * 0.07)}>
                  <div className="grid grid-cols-[48px_1fr] gap-4 py-5">
                    <span className="font-cinzel text-sm font-bold text-blood/40">{step.num}</span>
                    <div>
                      <p className="text-sm font-medium text-offwhite/80">{step.title}</p>
                      <p className="mt-0.5 text-xs text-bone/40">{step.desc}</p>
                    </div>
                  </div>
                  <div className="h-px bg-blood/[0.08]" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CTAs ── */}
        <motion.div {...fadeUp(0.35)} className="mt-14 flex flex-wrap justify-center gap-4">
          <TransitionLink href="/" className="btn btn-ghost px-6 py-3 text-sm">
            Return Home
          </TransitionLink>
          <TransitionLink href="/contact" className="btn btn-ghost px-6 py-3 text-sm">
            Contact Support
          </TransitionLink>
          {isVerified && (
            <>
              <TransitionLink href="/track" className="btn btn-primary px-6 py-3 text-sm">
                Track Your Order
              </TransitionLink>
              <TransitionLink href="/drops" className="btn btn-ghost px-6 py-3 text-sm">
                Track the next drop
              </TransitionLink>
            </>
          )}
        </motion.div>

      </div>
    </div>
  )
}
