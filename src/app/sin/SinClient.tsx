"use client"

import Script from "next/script"
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "framer-motion"

import { useRitualCheckout } from "@/app/bloodthirst-shop/hooks/useRitualCheckout"
import { useCheckoutAddOnDraft } from "@/app/bloodthirst-shop/hooks/useCheckoutAddOnDraft"
import { PhaseClose } from "@/app/bloodthirst-shop/components/PhaseClose"
import { BlackGloveModal } from "@/app/bloodthirst-shop/components/PremiumInquiry"
import { getPackById } from "@/lib/shop/catalog"
import { SIN_CHECKOUT_PACK_IDS } from "@/lib/shop/checkout-availability"
import { SIN_ENTRY_PACK_ID } from "@/content/sin"
import { MASS_TICKER } from "@/content/sin-mass"

import { SinCheckoutSheet } from "./components/SinCheckoutSheet"
import { ScrollBlood } from "./components/ScrollBlood"
import { MassHeader } from "./mass/MassHeader"
import { MassHero } from "./mass/MassHero"
import { MassObject } from "./mass/MassObject"
import { MassBuy } from "./mass/MassBuy"
import { MassWhy } from "./mass/MassWhy"
import { MassSticky } from "./mass/MassSticky"
import { MassProof } from "./mass/MassProof"
import { MassTease } from "./mass/MassTease"
import { MassVersus } from "./mass/MassVersus"
import { MassFaq } from "./mass/MassFaq"
import { MassVault } from "./mass/MassVault"
import { MassFinal } from "./mass/MassFinal"
import { MassSignals } from "./mass/MassSignals"
import { Hazard, Ticker } from "./mass/theme"

/** Tracks whether Razorpay's checkout.js is usable yet — drives the loading /
 * retry CTA states so the user never sees the hook's "not configured" path
 * just because the script hasn't finished loading. */
type RazorpayStatus = "loading" | "ready" | "error"

/** Private cart key — must match the useRitualCheckout storageKey below so the
 *  Do Not Buy handlers can write it synchronously. */
const SIN_CART_KEY = "unholy_cart_sin"

function writeCart(packId: string, shipping: unknown) {
  try {
    localStorage.setItem(SIN_CART_KEY, JSON.stringify({ packId, shipping }))
  } catch {
    /* storage unavailable — selection still works for this render */
  }
}

export function SinClient({
  razorpayKey,
  defaultPackId,
}: {
  razorpayKey?: string
  defaultPackId?: string
}) {
  // Add-on draft (Cursed Note + Unholy Ledger). Private storage key — /sin
  // must not inherit add-on state saved on /bloodthirst-shop (and vice versa).
  const addOnDraft = useCheckoutAddOnDraft("unholy_addons_sin")

  // Private cart key: /sin's available-pack set can differ from /buy or /shop,
  // so it must not inherit a pack saved elsewhere. Keep its cart to itself.
  const checkout = useRitualCheckout({
    razorpayKey,
    defaultPackId,
    storageKey: SIN_CART_KEY,
    checkoutAddOns: addOnDraft.checkoutAddOns,
    addToCartOnPackSelect: true,
    suppressCheckoutAddToCart: true,
    checkoutSource: "sin",
    allowedPackIds: SIN_CHECKOUT_PACK_IDS,
    onCheckoutSuccess: addOnDraft.clearDraft,
  })
  const { isSealed, goToReceipt, sign, isSubmitting } = checkout

  const [rzStatus, setRzStatus] = useState<RazorpayStatus>("loading")
  const [scriptKey, setScriptKey] = useState(0)
  const [connecting, setConnecting] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [blackGloveOpen, setBlackGloveOpen] = useState(false)
  const pendingPay = useRef(false)
  const prevPackIdRef = useRef<string | null>(null)

  const scrollToBuy = useCallback(() => {
    document
      .getElementById("sin-buy")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  // Tease band → vault. Anchor-scrolls down to the on-page shelf (no off-site leak).
  const scrollToVault = useCallback(() => {
    document
      .getElementById("sin-vault")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const openSheet = useCallback(() => setSheetOpen(true), [])

  const clearQueuedPayment = useCallback(() => {
    pendingPay.current = false
    setConnecting(false)
  }, [])

  // Closing the sheet restores the previous pack if we were buying the special
  // "Do Not Buy" SKU (which temporarily takes over `selected`).
  const closeSheet = useCallback(() => {
    clearQueuedPayment()
    setSheetOpen(false)
    if (checkout.selected.id === "donotbuy") {
      const prev =
        getPackById(prevPackIdRef.current || defaultPackId || "") || getPackById(SIN_ENTRY_PACK_ID)
      if (prev) {
        writeCart(prev.id, checkout.form)
        checkout.selectPack(prev)
      }
    }
  }, [checkout, clearQueuedPayment, defaultPackId])

  // "Do Not Buy" — the buyable stunt. Take over `selected` with the hidden SKU,
  // clear any add-ons (the crate already bundles them), and open checkout. The
  // cart is written SYNCHRONOUSLY so a re-mount restores donotbuy from storage
  // rather than clobbering it back to the prior pack.
  const onDoNotBuy = useCallback(() => {
    const dnb = getPackById("donotbuy")
    if (!dnb) return
    if (checkout.selected.id !== "donotbuy") prevPackIdRef.current = checkout.selected.id
    addOnDraft.setNoteEnabled(false)
    addOnDraft.setLedgerEnabled(false)
    writeCart("donotbuy", checkout.form)
    checkout.selectPack(dnb)
    setSheetOpen(true)
  }, [checkout, addOnDraft])

  // Pay handler. Only ever calls sign() once Razorpay's script is actually
  // present, so the gateway-not-configured branch can't fire on a slow load.
  const onPay = useCallback(() => {
    if (isSubmitting || connecting || pendingPay.current) return
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
  }, [connecting, isSubmitting, rzStatus, sign])

  // Fire the queued payment the moment the script becomes usable.
  useEffect(() => {
    if (rzStatus !== "ready" || !pendingPay.current || !sheetOpen) return
    pendingPay.current = false
    setConnecting(false)
    sign()
  }, [rzStatus, sheetOpen, sign])

  // Guard against older /sin localStorage restoring a pack outside this paid
  // funnel. The shared allowlist includes the hidden "Do Not Buy" stunt SKU.
  useEffect(() => {
    if (
      SIN_CHECKOUT_PACK_IDS.includes(
        checkout.selected.id as (typeof SIN_CHECKOUT_PACK_IDS)[number]
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
      {/* Warm the gateway origins early — the sheet-open → Razorpay handoff is
          the highest-intent moment on the page; shave the TLS setup off it. */}
      <link rel="preconnect" href="https://checkout.razorpay.com" />
      <link rel="preconnect" href="https://api.razorpay.com" />
      <Script
        key={scriptKey}
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onReady={() => setRzStatus("ready")}
        onLoad={() => setRzStatus("ready")}
        onError={() => {
          clearQueuedPayment()
          setRzStatus("error")
        }}
      />

      {/* Flat ink ground — the RED MASS is slabs and hard rules, no spotlights. */}
      <div aria-hidden className="fixed inset-0 z-0 bg-[#050505]" />

      {/* reading-progress seam — hidden once the order is sealed */}
      {!isSealed && <ScrollBlood />}

      <MassHeader onBuy={scrollToBuy} />
      <MassSignals />

      <AnimatePresence>
        {!isSealed && (
          <motion.div
            key="page"
            initial={false}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <MassHero onBuy={scrollToBuy} />
            <Ticker items={MASS_TICKER} tone="blood" />
            <MassObject />
            <MassBuy
              selected={checkout.selected}
              onSelect={checkout.selectPack}
              onAcquire={openSheet}
            />
            <MassWhy selected={checkout.selected} />
            <Ticker items={MASS_TICKER} tone="paper" speed={32} />
            <MassProof />
            <MassTease onOpen={scrollToVault} />
            <MassVersus onBuy={scrollToBuy} />
            <Hazard />
            <MassFaq />
            <MassVault
              onBlackGlove={() => setBlackGloveOpen(true)}
              onDoNotBuy={onDoNotBuy}
            />
            <MassFinal onBuy={scrollToBuy} />
          </motion.div>
        )}
      </AnimatePresence>

      {!isSealed && (
        <MassSticky
          selected={checkout.selected}
          total={checkout.effectiveTotal}
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
        ledgerEnabled={addOnDraft.ledgerEnabled}
        onLedgerToggle={addOnDraft.setLedgerEnabled}
        ledgerName={addOnDraft.ledgerName}
        onLedgerNameChange={addOnDraft.setLedgerName}
        ledgerCity={addOnDraft.ledgerCity}
        onLedgerCityChange={addOnDraft.setLedgerCity}
        ledgerConfession={addOnDraft.ledgerConfession}
        onLedgerConfessionChange={addOnDraft.setLedgerConfession}
        ledgerConsent={addOnDraft.ledgerConsent}
        onLedgerConsentChange={addOnDraft.setLedgerConsent}
      />

      {/* Black Glove — reuse the existing "drop your details" inquiry modal. */}
      {blackGloveOpen && <BlackGloveModal onClose={() => setBlackGloveOpen(false)} />}

      {/* Post-payment finale — reuse the ritual page's wax-seal close as-is. */}
      <AnimatePresence>
        {isSealed && (
          <motion.div
            key="close"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[20] overflow-y-auto bg-[#050505]"
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
