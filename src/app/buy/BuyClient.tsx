"use client"

import Script from "next/script"
import Link from "next/link"
import type { Route } from "next"
import { useCallback, useEffect } from "react"
import { AnimatePresence, MotionConfig, motion } from "framer-motion"

import { useRitualCheckout } from "@/app/bloodthirst-shop/hooks/useRitualCheckout"
import { PhaseClose } from "@/app/bloodthirst-shop/components/PhaseClose"
import { RitualCapture } from "@/app/bloodthirst-shop/components/RitualCapture"
import { FOOTNOTE } from "@/content/bloodthirst"
import { FILE_CHROME } from "@/content/bloodthirst-buy"

import { Hero, IndexStrip } from "./components/Hero"
import { Answers } from "./components/Answers"
import { BuyPanel } from "./components/BuyPanel"
import { Versus } from "./components/Versus"
import { FactsLabel } from "./components/FactsLabel"
import { Street } from "./components/Street"
import { Faq } from "./components/Faq"
import { FinalCall } from "./components/FinalCall"
import { StickyBuyBar } from "./components/StickyBuyBar"

/**
 * /buy — conversion-first BloodThirst landing page for paid (Instagram) traffic.
 *
 * ART DIRECTION: the cursed document — a batch intake file from the Records
 * Division. Stamps, ruled ledgers, file numbers, one redaction. No glow orbs,
 * no scroll-triggered motion; the only animation is the CSS hero entrance and
 * the payment finale. Lighter than /bloodthirst-shop by design: no three.js,
 * no GSAP, no Lenis.
 *
 * Persuasion order: identity → clarity → purchase → objections → proof →
 * final call. Every section below the buy panel funnels back to it.
 */

const SUPPORT_LINKS: Array<{ label: string; href: Route }> = [
  { label: "FAQ", href: "/faq" },
  { label: "Track", href: "/track" },
  { label: "Refunds", href: "/refund" },
  { label: "Contact", href: "/contact" },
]

export function BuyClient({ razorpayKey }: { razorpayKey?: string }) {
  // Cold ad traffic anchors on the smallest pack — the hero promises an entry
  // price, so the panel must open on one. Saved carts still restore over this.
  const checkout = useRitualCheckout({ razorpayKey, defaultPackId: "pack6" })
  const { isSealed, goToReceipt } = checkout

  const scrollToBuy = useCallback(() => {
    const buyPanel = document.getElementById("bt-buy")
    if (!buyPanel) return
    window.scrollTo({
      top: buyPanel.offsetTop,
      behavior: "smooth",
    })
  }, [])

  // On seal: lock scroll behind the finale, then auto-advance to the receipt.
  useEffect(() => {
    if (!isSealed) return
    window.scrollTo({ top: 0, behavior: "instant" })
    document.body.style.overflow = "hidden"
    const t = setTimeout(() => goToReceipt(), 6000)
    return () => {
      document.body.style.overflow = ""
      clearTimeout(t)
    }
  }, [isSealed, goToReceipt])

  return (
    <MotionConfig reducedMotion="user">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      {/* Document base — near-black, matte. No glow; the NoiseGrain layer in
          the root layout supplies the paper texture. */}
      <div className="fixed inset-0 z-0 bg-[#0a0a0a]" aria-hidden />

      {/* Marginalia — file ID running down the left edge, desktop only */}
      <p
        aria-hidden
        className="pointer-events-none fixed left-3 top-1/2 z-[5] hidden -translate-y-1/2 -rotate-180 select-none font-mono text-[8px] uppercase tracking-[0.5em] text-bone/25 lg:block"
        style={{ writingMode: "vertical-rl" }}
      >
        {FILE_CHROME.marginalia}
      </p>

      <SlimHeader onBuy={scrollToBuy} />

      <AnimatePresence>
        {!isSealed && (
          <motion.div
            key="page"
            initial={false}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <Hero onBuy={scrollToBuy} />
            <IndexStrip />
            <Answers />
            <BuyPanel
              selected={checkout.selected}
              onSelect={checkout.selectPack}
              form={checkout.form}
              errors={checkout.errors}
              onChange={checkout.updateField}
              onBlur={checkout.blurField}
              onSign={checkout.sign}
              isSubmitting={checkout.isSubmitting}
              payError={checkout.payError}
              appliedPromo={checkout.appliedPromo}
              pricing={checkout.pricing}
              onApplyPromo={checkout.applyPromo}
              onRemovePromo={checkout.removePromo}
            />
            <Versus onBuy={scrollToBuy} />
            <FactsLabel />
            <Street />
            <Faq />
            <FinalCall onBuy={scrollToBuy} />
            <RitualCapture />

            <footer className="relative z-10 border-t border-bone/15 px-6 py-12 text-center">
              <nav
                aria-label="BloodThirst support"
                className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-[9px] uppercase tracking-[0.32em] text-bone/50"
              >
                {SUPPORT_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition-colors hover:text-blood"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/40">
                {FOOTNOTE}
              </p>
              <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.5em] text-bone/30">
                — {FILE_CHROME.endOfFile} —
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSealed && (
        <StickyBuyBar
          selected={checkout.selected}
          total={checkout.pricing.total}
          onTap={scrollToBuy}
        />
      )}

      {/* Post-payment finale — same wax-seal close as the ritual page */}
      <AnimatePresence>
        {isSealed && (
          <motion.div
            key="close"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[20] overflow-y-auto bg-[#0a0a0a]"
          >
            <PhaseClose
              selected={checkout.selected}
              form={checkout.form}
              total={checkout.confirmedTotal}
              onContinue={goToReceipt}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

/* ─── Slim header — division masthead + jump-to-buy. No nav maze for ad traffic. ─── */
function SlimHeader({ onBuy }: { onBuy: () => void }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-4 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent px-5 py-3 md:px-10 md:py-4">
      <Link
        href="/"
        className="pointer-events-auto font-cinzel text-xs font-black uppercase tracking-[0.45em] text-offwhite/85 transition-colors hover:text-offwhite"
      >
        UNHOLY CO.
      </Link>
      <span className="hidden font-mono text-[8px] uppercase tracking-[0.35em] text-bone/40 md:inline">
        {FILE_CHROME.division}
      </span>
      <a
        href="#bt-buy"
        onClick={onBuy}
        className="pointer-events-auto inline-flex items-center gap-2 border border-bone/20 bg-black/50 px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.28em] text-bone/80 backdrop-blur-sm transition-colors hover:border-blood/60 hover:text-blood md:px-4 md:text-[10px]"
      >
        <span>buy now</span>
        <span className="inline-block h-px w-5 bg-bone/40" />
      </a>
    </header>
  )
}
