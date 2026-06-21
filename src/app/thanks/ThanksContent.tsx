"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { useEffect, useLayoutEffect, type ReactNode } from "react"
import { usePostHog } from "posthog-js/react"
import { TransitionLink } from "@/components/ux/TransitionLink"
import { trackPixel } from "@/lib/meta-pixel"
import type { CheckoutAddOnRecord } from "@/lib/shop/addons"
import type { ReceiptPricing } from "@/lib/shop/receipt"

type ReceiptSummary = {
  packId: string
  qty: number
  orderId?: string
  receiptId?: string
  packTitle?: string
  price?: number
  pricing?: ReceiptPricing
  promoCode?: string
  addOns?: CheckoutAddOnRecord[]
  shippingName?: string
  shippingCity?: string
  shippingState?: string
  pending?: boolean
} | null

const nextSteps = [
  { num: "01", title: "Confirmation", desc: "Order details arrive by email within minutes." },
  { num: "02", title: "Dispatch", desc: "The pack is booked for courier handoff within 24-48 hours." },
  { num: "03", title: "Track", desc: "Use your order ID or checkout email at the track page." },
]

const fadeUp = (delay = 0) => ({
  initial: { y: 18 },
  animate: { y: 0 },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export function ThanksContent({ receipt }: { receipt: ReceiptSummary }) {
  const isVerified = Boolean(receipt && !receipt.pending)
  const posthog = usePostHog()
  const total = receiptTotal(receipt)

  useLayoutEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has("receipt")) return
    url.searchParams.delete("receipt")
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
  }, [])

  useEffect(() => {
    // The BloodThirst finale locks the document while it seals. A route handoff
    // to the receipt must always land scrollable even if that cleanup races.
    document.body.style.removeProperty("overflow")
    document.documentElement.style.removeProperty("overflow")
  }, [])

  useEffect(() => {
    if (!isVerified || !receipt) return

    // Guard: only fire conversion events once per orderId. The thanks page can
    // be reloaded, revisited via email link, or restored from bfcache.
    const dedupKey = receipt.orderId || `${receipt.packId}-${receipt.qty}-${receiptTotal(receipt) ?? ""}`
    const storageKey = `unholy_purchase_fired_${dedupKey}`
    try {
      if (localStorage.getItem(storageKey)) return
      localStorage.setItem(storageKey, String(Date.now()))
    } catch {
      // localStorage unavailable: fire the real conversion rather than drop it.
    }

    posthog?.capture("order_completed", {
      pack_id: receipt.packId,
      quantity: receipt.qty,
    })
    // Meta Pixel Purchase uses orderId so the browser and CAPI events dedupe.
    trackPixel(
      "Purchase",
      {
        value: receiptTotal(receipt),
        currency: "INR",
        content_ids: [receipt.packId],
        content_name: receipt.packTitle,
        content_type: "product",
        num_items: receipt.qty,
        contents: [{ id: receipt.packId, quantity: 1, item_price: receiptTotal(receipt) }],
      },
      receipt.orderId,
    )
  }, [isVerified, receipt, posthog])

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0a0a0a] text-offwhite">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 85% 72% at 66% 18%, rgba(176,0,32,0.22), transparent 64%), radial-gradient(ellipse 70% 58% at 18% 88%, rgba(176,0,32,0.1), transparent 72%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 115% 90% at 50% 42%, transparent 38%, rgba(10,10,10,0.8) 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blood/35 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center gap-12 px-6 pb-16 pt-16 md:min-h-[calc(100vh-6rem)] md:px-10 md:pb-20 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(30rem,0.92fr)] lg:gap-10">
        <section className="relative min-w-0">
          <motion.div {...fadeUp(0)} className="relative z-10 max-w-2xl">
            <div className="mb-8 flex items-center gap-4">
              <span className="h-px w-12 bg-blood/75" />
              <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood/85">
                {isVerified ? "Receipt sealed" : "Receipt pending"}
              </p>
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-bone/45">
              BloodThirst checkout
            </p>
            <h1
              className={`mt-5 max-w-xl break-words font-cinzel font-black uppercase leading-[0.92] text-offwhite ${
                isVerified
                  ? "text-[clamp(2.6rem,6vw,5rem)]"
                  : "text-[clamp(2.35rem,5vw,4.2rem)]"
              }`}
            >
              {isVerified ? "The ritual is complete." : "Awaiting confirmation."}
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-bone/68 md:text-lg">
              {isVerified
                ? "Your BloodThirst is claimed. The verified receipt is below, and tracking follows as soon as the pack enters dispatch."
                : "This page needs a verified payment receipt before it can confirm an order. If Razorpay charged you, support can trace it from the checkout details."}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              {isVerified ? (
                <>
                  <RitualLink href="/track" tone="blood">Track order</RitualLink>
                  <RitualLink href="/contact">Contact support</RitualLink>
                </>
              ) : (
                <>
                  <RitualLink href="/contact" tone="blood">Contact support</RitualLink>
                  <RitualLink href="/">Return home</RitualLink>
                </>
              )}
            </div>
          </motion.div>
        </section>

        <motion.section
          {...fadeUp(0.08)}
          className="relative border border-bone/15 bg-black/60 p-6 backdrop-blur-md md:p-8"
          style={{
            boxShadow:
              "0 48px 140px -42px rgba(176,0,32,0.42), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <CornerMarks />
          <div className="flex items-start justify-between gap-6">
            <SealMark verified={isVerified} />
            <div aria-hidden className="relative flex h-28 w-20 shrink-0 items-end justify-center">
              <div className="absolute bottom-3 h-9 w-20 bg-blood/25 blur-2xl" />
              <Image
                src="/can.webp"
                alt=""
                width={72}
                height={126}
                className="relative drop-shadow-[0_18px_42px_rgba(176,0,32,0.4)]"
                style={{ width: "72px", height: "auto" }}
                priority
              />
            </div>
          </div>

          <div className="mt-7 flex items-end justify-between gap-4 border-b border-bone/12 pb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-blood/75">
                {isVerified ? "Verified order" : "Verification needed"}
              </p>
              <p className="mt-3 font-cinzel text-2xl font-black uppercase text-offwhite md:text-3xl">
                {isVerified ? "BloodThirst receipt" : "Payment receipt"}
              </p>
            </div>
            {total !== undefined ? (
              <p className="font-cinzel text-3xl font-black tabular-nums text-offwhite md:text-4xl">
                INR {formatReceiptMoney(total)}
              </p>
            ) : null}
          </div>

          {receipt ? (
            <>
              <div className="divide-y divide-bone/10 py-3 font-mono">
                {receiptRows(receipt).map((row) => (
                  <ReceiptRow key={row.label} {...row} />
                ))}
              </div>

              <div className="mt-7 border-t border-bone/12 pt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-bone/45">
                  What happens next
                </p>
                <div className="mt-5 grid gap-px border border-bone/12 bg-bone/12 md:grid-cols-3">
                  {nextSteps.map((step) => (
                    <div key={step.num} className="min-h-36 bg-black/80 p-4">
                      <p className="font-cinzel text-sm font-black text-blood/75">{step.num}</p>
                      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.32em] text-offwhite">
                        {step.title}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-bone/55">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-7">
              <div className="border border-blood/30 bg-blood/[0.08] px-5 py-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-blood/85">
                  No signed receipt detected
                </p>
                <p className="mt-4 text-sm leading-relaxed text-bone/65">
                  If checkout was interrupted before verification, do not retry blindly after a successful charge.
                  Send support the payment details and we will inspect the order record.
                </p>
              </div>
              <div className="mt-6 grid gap-px border border-bone/12 bg-bone/12 sm:grid-cols-3">
                {["UPI", "Cards", "Net banking"].map((method) => (
                  <span
                    key={method}
                    className="bg-black/80 px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-bone/50"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-bone/12 pt-5 font-mono text-[9px] uppercase tracking-[0.38em] text-bone/40">
            <span>Razorpay verified checkout</span>
            <TransitionLink href="/drops" className="text-bone/55 hover:text-blood">
              Track the next drop
            </TransitionLink>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

function SealMark({ verified }: { verified: boolean }) {
  return (
    <div className="relative z-10 flex h-20 w-20 items-center justify-center border border-blood/35 bg-black/80 shadow-[0_0_55px_rgba(176,0,32,0.22)]">
      <div className="absolute inset-2 border border-bone/15" />
      {verified ? (
        <svg className="relative h-8 w-8 text-blood" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7.5 12.5l2.8 2.8 6.2-6.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="relative h-8 w-8 text-bone/55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16.5h.01" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

function CornerMarks() {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l border-t border-blood/85" />
      <span className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r border-t border-blood/85" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b border-l border-blood/85" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b border-r border-blood/85" />
    </>
  )
}

function RitualLink({
  href,
  children,
  tone = "bone",
}: {
  href: string
  children: ReactNode
  tone?: "bone" | "blood"
}) {
  return (
    <TransitionLink
      href={href}
      className={`group inline-flex min-h-12 items-center gap-3 border px-5 font-mono text-[10px] uppercase tracking-[0.42em] text-offwhite ${
        tone === "blood"
          ? "border-blood bg-blood shadow-[0_0_36px_rgba(176,0,32,0.32)] hover:border-blood hover:text-offwhite"
          : "border-bone/25 bg-black/35 hover:border-blood/70 hover:text-offwhite"
      }`}
    >
      <span>{children}</span>
      <span className="h-px w-5 bg-bone/45 transition-all duration-300 group-hover:w-8 group-hover:bg-offwhite" />
    </TransitionLink>
  )
}

function ReceiptRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr] sm:items-baseline sm:gap-5">
      <span className="text-[10px] uppercase tracking-[0.35em] text-bone/45">{label}</span>
      <span className={`break-words text-sm text-offwhite/85 ${mono ? "text-xs tracking-[0.18em]" : ""}`}>
        {value}
      </span>
    </div>
  )
}

function receiptRows(receipt: NonNullable<ReceiptSummary>) {
  const pricing = receipt.pricing
  return [
    receipt.orderId && { label: "Order ID", value: receipt.orderId, mono: true },
    receipt.receiptId && { label: "Receipt", value: receipt.receiptId, mono: true },
    receipt.packTitle && { label: "Pack", value: receipt.packTitle },
    { label: "Quantity", value: `${receipt.qty} cans` },
    ...(receipt.addOns || []).map((addOn) => ({
      label: addOn.title,
      value: `INR ${formatReceiptMoney(addOn.price)}`,
    })),
    pricing?.discountAmount
      ? {
          label: receipt.promoCode ? `Discount ${receipt.promoCode}` : "Discount",
          value: `-INR ${formatReceiptMoney(pricing.discountAmount)}`,
        }
      : null,
    pricing && { label: "Subtotal excl. GST", value: `INR ${formatReceiptMoney(pricing.subtotal)}` },
    pricing && { label: "GST included", value: `INR ${formatReceiptMoney(pricing.gstAmount)}` },
    receipt.shippingName && {
      label: "Delivering to",
      value: [receipt.shippingName, receipt.shippingCity, receipt.shippingState].filter(Boolean).join(", "),
    },
  ].filter(Boolean) as Array<{ label: string; value: string; mono?: boolean }>
}

function receiptTotal(receipt: ReceiptSummary) {
  return receipt?.pricing?.total ?? receipt?.price
}

function formatReceiptMoney(amount: number) {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}
