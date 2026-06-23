"use client"

import Script from "next/script"
import Link from "next/link"
import type { Route } from "next"
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "framer-motion"

import { useRitualCheckout } from "@/app/bloodthirst-shop/hooks/useRitualCheckout"
import { useCheckoutAddOnDraft } from "@/app/bloodthirst-shop/hooks/useCheckoutAddOnDraft"
import { PhaseClose } from "@/app/bloodthirst-shop/components/PhaseClose"
import { getPackById } from "@/lib/shop/catalog"
import { SIN_AVAILABLE_PACK_IDS, SIN_ENTRY_PACK_ID, SIN_FOOTER } from "@/content/sin"

import { SinHero, SpecSeam } from "./components/SinHero"
import { SinExhibit } from "./components/SinExhibit"
import { SinCheckout } from "./components/SinCheckout"
import { SinCheckoutSheet } from "./components/SinCheckoutSheet"
import { SinValue } from "./components/SinValue"
import { SinProof } from "./components/SinProof"
import { SinVersus } from "./components/SinVersus"
import { SinFaq } from "./components/SinFaq"
import { SinFinal } from "./components/SinFinal"
import { SinTeaser } from "./components/SinTeaser"
import { SinVault } from "./components/SinVault"
import { SinStickyBar } from "./components/SinStickyBar"
import { Atmosphere } from "./components/Atmosphere"
import { Reveal } from "./components/Reveal"
import { Kicker } from "./components/marks"

/** Tracks whether Razorpay's checkout.js is usable yet — drives the loading /
 * retry CTA states so the user never sees the hook's "not configured" path
 * just because the script hasn't finished loading. */
type RazorpayStatus = "loading" | "ready" | "error"

const SUPPORT_LINKS: Array<{ label: string; href: Route }> = [
  { label: "FAQ", href: "/faq" },
  { label: "Track", href: "/track" },
  { label: "Refunds", href: "/refund" },
  { label: "Contact", href: "/contact" },
]

export function SinClient({
  razorpayKey,
  defaultPackId,
}: {
  razorpayKey?: string
  defaultPackId?: string
}) {
  // Cursed Note add-on draft (the single piece of theater allowed onto the
  // checkout spine). Private storage key — like the cart, /sin must not inherit
  // add-on state saved on /bloodthirst-shop (and vice versa).
  const addOnDraft = useCheckoutAddOnDraft("unholy_addons_sin")

  // Private cart key: /sin's available-pack set can differ from /buy or /shop,
  // so it must not inherit a pack saved elsewhere. Keep its cart to itself.
  // addToCartOnPackSelect feeds Meta cleaner funnel signal as packs are chosen;
  // suppressCheckoutAddToCart avoids double-counting against the add-on total
  // (mirrors MobileRitual) — InitiateCheckout carries the add-on-inclusive value.
  const checkout = useRitualCheckout({
    razorpayKey,
    defaultPackId,
    storageKey: "unholy_cart_sin",
    checkoutAddOns: addOnDraft.checkoutAddOns,
    addToCartOnPackSelect: true,
    suppressCheckoutAddToCart: true,
  })
  const { isSealed, goToReceipt, sign, isSubmitting } = checkout

  const [rzStatus, setRzStatus] = useState<RazorpayStatus>("loading")
  const [scriptKey, setScriptKey] = useState(0)
  const [connecting, setConnecting] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const pendingPay = useRef(false)

  const scrollToBuy = useCallback(() => {
    document
      .getElementById("sin-buy")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  // Teaser → vault. Anchor-scrolls down to the on-page vault (no off-site leak).
  const scrollToVault = useCallback(() => {
    document
      .getElementById("sin-vault")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const openSheet = useCallback(() => setSheetOpen(true), [])
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  // Pay handler. Only ever calls sign() once Razorpay's script is actually
  // present, so the gateway-not-configured branch can't fire on a slow load.
  // If the script is still loading we queue the intent and show a connecting
  // state; if it failed we re-mount the <Script> and retry.
  const onPay = useCallback(() => {
    if (isSubmitting) return
    if (typeof window !== "undefined" && window.Razorpay) {
      setConnecting(false)
      sign()
      return
    }
    pendingPay.current = true
    setConnecting(true)
    if (rzStatus === "error") {
      setRzStatus("loading")
      setScriptKey((k) => k + 1)
    }
  }, [isSubmitting, rzStatus, sign])

  // Fire the queued payment the moment the script becomes usable.
  useEffect(() => {
    if (rzStatus !== "ready" || !pendingPay.current) return
    pendingPay.current = false
    setConnecting(false)
    sign()
  }, [rzStatus, sign])

  // Guard against older /sin localStorage restoring a single or 3-pack after
  // those packs were temporarily removed from this paid funnel.
  useEffect(() => {
    if (
      SIN_AVAILABLE_PACK_IDS.includes(
        checkout.selected.id as (typeof SIN_AVAILABLE_PACK_IDS)[number]
      )
    ) {
      return
    }
    const fallback = getPackById(SIN_ENTRY_PACK_ID)
    if (fallback) checkout.selectPack(fallback)
  }, [checkout])

  // On seal: freeze behind the finale, then auto-advance to the receipt.
  useEffect(() => {
    if (!isSealed) return
    setSheetOpen(false)
    window.scrollTo({ top: 0, behavior: "instant" })
    const t = setTimeout(() => goToReceipt(), 6000)
    return () => clearTimeout(t)
  }, [isSealed, goToReceipt])

  // Single source of truth for the body scroll lock — the finale OR the sheet.
  useEffect(() => {
    const lock = isSealed || sheetOpen
    if (!lock) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [isSealed, sheetOpen])

  return (
    <MotionConfig reducedMotion="user">
      <Script
        key={scriptKey}
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setRzStatus("ready")}
        onLoad={() => setRzStatus("ready")}
        onError={() => setRzStatus("error")}
      />

      {/* Black-room ground: near-black velvet with one soft spotlight overhead.
          Static gradients — no JS, no heavy filters. */}
      <div aria-hidden className="fixed inset-0 z-0 bg-[#070707]" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% -8%, rgba(176,0,32,0.14), transparent 55%), radial-gradient(80% 50% at 50% 0%, rgba(246,246,246,0.05), transparent 60%)",
        }}
      />
      <Atmosphere />

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
            <SinHero onBuy={scrollToBuy} />
            <SpecSeam />
            <SinExhibit />
            <SinCheckout
              selected={checkout.selected}
              onSelect={checkout.selectPack}
              onAcquire={openSheet}
            />
            <Reveal>
              <SinValue selected={checkout.selected} onBuy={scrollToBuy} />
            </Reveal>
            <SinProof />
            <SinTeaser onPick={scrollToVault} />
            <Reveal>
              <SinVersus onBuy={scrollToBuy} />
            </Reveal>
            <Reveal>
              <SinFaq />
            </Reveal>
            <SinVault />
            <Reveal>
              <SinFinal onBuy={scrollToBuy} />
            </Reveal>

            <footer className="relative z-10 border-t border-bone/12 px-6 py-14 text-center">
              <nav
                aria-label="BloodThirst support"
                className="mb-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 font-mono text-[9px] uppercase tracking-[0.32em] text-bone/45"
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
              <div className="flex justify-center">
                <Kicker>{SIN_FOOTER.footnote}</Kicker>
              </div>
              <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.5em] text-bone/25">
                {SIN_FOOTER.endMark}
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSealed && (
        <SinStickyBar
          selected={checkout.selected}
          total={checkout.selected.price}
          onTap={openSheet}
        />
      )}

      {/* Focused checkout — opens on intent, reuses the real ritual checkout. */}
      <SinCheckoutSheet
        open={sheetOpen && !isSealed}
        onClose={closeSheet}
        selected={checkout.selected}
        form={checkout.form}
        errors={checkout.errors}
        onChange={checkout.updateField}
        onBlur={checkout.blurField}
        pricing={checkout.pricing}
        appliedPromo={checkout.appliedPromo}
        onApplyPromo={checkout.applyPromo}
        onRemovePromo={checkout.removePromo}
        onPay={onPay}
        isSubmitting={isSubmitting}
        connecting={connecting}
        rzError={rzStatus === "error"}
        payError={checkout.payError}
        payErrorKind={checkout.payErrorKind}
        addOns={addOnDraft.checkoutAddOns}
        noteEnabled={addOnDraft.noteEnabled}
        onNoteToggle={addOnDraft.setNoteEnabled}
        noteTone={addOnDraft.noteTone}
        onNoteToneChange={addOnDraft.setNoteTone}
        recipientName={addOnDraft.recipientName}
        onRecipientChange={addOnDraft.setRecipientName}
        noteContext={addOnDraft.noteContext}
        onNoteContextChange={addOnDraft.setNoteContext}
      />

      {/* Post-payment finale — reuse the ritual page's wax-seal close as-is. */}
      <AnimatePresence>
        {isSealed && (
          <motion.div
            key="close"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[20] overflow-y-auto bg-[#070707]"
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

/* ── Slim header — brand mark + jump-to-buy. No nav maze for cold traffic. ── */
function SlimHeader({ onBuy }: { onBuy: () => void }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-4 bg-gradient-to-b from-[#070707] via-[#070707]/75 to-transparent px-5 py-3 md:px-10 md:py-4">
      <Link
        href="/"
        className="pointer-events-auto font-cinzel text-xs font-black uppercase tracking-[0.45em] text-offwhite/85 transition-colors hover:text-offwhite"
      >
        UNHOLY CO.
      </Link>
      <span className="hidden font-mono text-[8px] uppercase tracking-[0.4em] text-bone/35 md:inline">
        BLOODTHIRST · BATCH 001
      </span>
      <button
        type="button"
        onClick={onBuy}
        className="pointer-events-auto inline-flex items-center gap-2 border border-bone/20 bg-black/40 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/80 backdrop-blur-sm transition-colors hover:border-blood/60 hover:text-blood md:text-[10px]"
      >
        <span>acquire</span>
        <span aria-hidden className="inline-block h-px w-5 bg-bone/40" />
      </button>
    </header>
  )
}
