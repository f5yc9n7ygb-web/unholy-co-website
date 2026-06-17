"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, MotionConfig, motion } from "framer-motion"
import { ArrowDown, Check, Gift, Lock, ShieldCheck, Sparkles, Truck } from "lucide-react"

import { MobileBuyBar } from "../components/MobileBuyBar"
import { PhaseClose } from "../components/PhaseClose"
import { RitualForm } from "../components/RitualForm"
import { useRitualCheckout, type CheckoutAddOn } from "../hooks/useRitualCheckout"
import { MobileAddOnsSheet } from "./MobileAddOnsSheet"
import { CHECKOUT_ADD_ON_CONFIG, type NoteTone } from "@/lib/shop/addon-config"
import { PACKS, type Pack } from "@/lib/shop/catalog"
import { trackBloodthirstEvent } from "@/lib/analytics/bloodthirst"

const DeferredMobileCanStage = dynamic(
  () => import("./MobileCanStage").then((mod) => mod.MobileCanStage),
  { ssr: false }
)

type CanvasFallbackReason =
  | "reduced_motion"
  | "save_data"
  | "weak_device"
  | "slow_connection"
  | "canvas_timeout"

const PROOF_ITEMS = [
  { icon: <ShieldCheck size={16} />, label: "FSSAI licensed" },
  { icon: <Truck size={16} />, label: "24–48 hrs dispatch" },
  { icon: <Sparkles size={16} />, label: "Zero sugar. Zero caffeine." },
  { icon: <Check size={16} />, label: "Secure Razorpay checkout" },
] as const

// "Starts with" on the hero is the entry price floor, not the selected pack.
const FROM_PRICE = Math.min(...PACKS.map((pack) => pack.price))

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

export function MobileRitual({ razorpayKey }: { razorpayKey?: string }) {
  const scrollRef = useRef<HTMLElement>(null)
  const arrivalRef = useRef<HTMLElement>(null)
  const proofRef = useRef<HTMLElement>(null)
  const offerRef = useRef<HTMLElement>(null)
  const canSlotRef = useRef<HTMLDivElement>(null)
  const mountAt = useRef(Date.now())

  const [snapEnabled, setSnapEnabled] = useState(true)
  const [barVisible, setBarVisible] = useState(false)
  const [addOnsOpen, setAddOnsOpen] = useState(false)
  const [noteEnabled, setNoteEnabled] = useState(false)
  const [ledgerEnabled, setLedgerEnabled] = useState(false)
  const [noteTone, setNoteTone] = useState<NoteTone>("Funny")
  const [recipientName, setRecipientName] = useState("")
  const [noteContext, setNoteContext] = useState("")
  const [ledgerName, setLedgerName] = useState("")
  const [ledgerCity, setLedgerCity] = useState("")
  const [ledgerConfession, setLedgerConfession] = useState("")
  const [ledgerConsent, setLedgerConsent] = useState(false)
  const [canvasAllowed, setCanvasAllowed] = useState(false)
  const [canvasInView, setCanvasInView] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [canvasFallback, setCanvasFallback] = useState<CanvasFallbackReason | null>(null)

  const checkoutAddOns = useMemo<CheckoutAddOn[]>(() => {
    const items: CheckoutAddOn[] = []
    if (noteEnabled) {
      const note = CHECKOUT_ADD_ON_CONFIG.cursed_note
      items.push({
        id: note.id,
        title: note.title,
        price: note.price,
        data: { tone: noteTone, recipientName, context: noteContext },
      })
    }
    if (ledgerEnabled && ledgerConsent) {
      const ledger = CHECKOUT_ADD_ON_CONFIG.unholy_ledger
      items.push({
        id: ledger.id,
        title: ledger.title,
        price: ledger.price,
        data: {
          displayName: ledgerName,
          city: ledgerCity,
          confession: ledgerConfession,
          consent: ledgerConsent,
        },
      })
    }
    return items
  }, [
    ledgerCity,
    ledgerConfession,
    ledgerConsent,
    ledgerEnabled,
    ledgerName,
    noteContext,
    noteEnabled,
    noteTone,
    recipientName,
  ])

  const checkout = useRitualCheckout({
    razorpayKey,
    defaultPackId: "pack3",
    checkoutAddOns,
    addToCartOnPackSelect: true,
    suppressCheckoutAddToCart: true,
  })

  const { isSealed, goToReceipt } = checkout
  const selectedIdRef = useRef(checkout.selected.id)
  selectedIdRef.current = checkout.selected.id

  useEffect(() => {
    if (!isSealed) return
    document.body.style.overflow = "hidden"
    const t = setTimeout(() => goToReceipt(), 6000)
    return () => {
      document.body.style.overflow = ""
      clearTimeout(t)
    }
  }, [isSealed, goToReceipt])

  useEffect(() => {
    const root = scrollRef.current
    const scenes = [
      ["arrival", arrivalRef.current],
      ["proof", proofRef.current],
      ["offer", offerRef.current],
    ] as const
    const seen = new Set<string>()
    let offerTracked = false
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.55) continue
        const scene = scenes.find(([, element]) => element === entry.target)?.[0]
        if (!scene) continue
        if (!seen.has(scene)) {
          seen.add(scene)
          trackBloodthirstEvent("scene_view", {
            scene,
            pack_id: selectedIdRef.current,
          })
        }
        if (scene === "offer" && !offerTracked && root) {
          offerTracked = true
          const maxScroll = Math.max(1, root.scrollHeight - root.clientHeight)
          trackBloodthirstEvent("time_to_offer_ms", {
            time_to_offer_ms: Date.now() - mountAt.current,
            scroll_depth_to_offer: Math.round((root.scrollTop / maxScroll) * 100) / 100,
            pack_id: selectedIdRef.current,
          })
        }
      }
    }, { root, threshold: [0.55] })

    scenes.forEach(([, element]) => element && observer.observe(element))
    return () => observer.disconnect()
  }, [])

  // Sticky buy bar appears only after the arrival hero scrolls away.
  useEffect(() => {
    const root = scrollRef.current
    const arrival = arrivalRef.current
    if (!root || !arrival) return
    const observer = new IntersectionObserver(
      ([entry]) => setBarVisible(entry.intersectionRatio < 0.5),
      { root, threshold: [0, 0.5, 1] },
    )
    observer.observe(arrival)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const slot = canSlotRef.current
    if (!slot || typeof window === "undefined") return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
      deviceMemory?: number
      hardwareConcurrency?: number
    }
    const effectiveType = nav.connection?.effectiveType || ""
    const reason: CanvasFallbackReason | null =
      reduceMotion ? "reduced_motion" :
      nav.connection?.saveData ? "save_data" :
      (nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ? "weak_device" :
      /2g/.test(effectiveType) ? "slow_connection" :
      null

    if (reason) {
      setCanvasFallback(reason)
      trackBloodthirstEvent("canvas_fallback", { reason })
      return
    }

    let idleId: number | null = null
    let scheduled = false
    let usedIdleCallback = false
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const scheduleCanvas = () => {
      if (scheduled) return
      scheduled = true
      if (win.requestIdleCallback) {
        usedIdleCallback = true
        idleId = win.requestIdleCallback(() => setCanvasAllowed(true), { timeout: 1500 })
      } else {
        idleId = window.setTimeout(() => setCanvasAllowed(true), 700)
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      setCanvasInView(entry.isIntersecting)
      if (entry.isIntersecting) scheduleCanvas()
    }, { rootMargin: "120px 0px", threshold: 0.05 })
    observer.observe(slot)

    return () => {
      observer.disconnect()
      if (idleId != null) {
        if (usedIdleCallback && win.cancelIdleCallback) win.cancelIdleCallback(idleId)
        else window.clearTimeout(idleId)
      }
    }
  }, [])

  useEffect(() => {
    if (!canvasAllowed || canvasReady || canvasFallback) return
    const timeout = window.setTimeout(() => {
      setCanvasFallback("canvas_timeout")
      trackBloodthirstEvent("canvas_fallback", { reason: "canvas_timeout" })
    }, 7000)
    return () => window.clearTimeout(timeout)
  }, [canvasAllowed, canvasFallback, canvasReady])

  const scrollToOffer = useCallback(() => {
    setSnapEnabled(false)
    offerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const selectPack = (pack: Pack) => {
    checkout.selectPack(pack)
    trackBloodthirstEvent("pack_select", {
      pack_id: pack.id,
      value: pack.price,
      currency: "INR",
    })
  }

  if (isSealed) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="fixed inset-0 z-[20] overflow-y-auto bg-[#0a0a0a]">
          <PhaseClose
            selected={checkout.selected}
            form={checkout.form}
            total={checkout.confirmedTotal}
            onContinue={goToReceipt}
          />
        </div>
      </MotionConfig>
    )
  }

  const canVisible = canvasAllowed && canvasInView && !canvasFallback

  return (
    <MotionConfig reducedMotion="user">
      <Script
        key="razorpay-checkout"
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <main
        ref={scrollRef}
        className="h-[100svh] overflow-y-auto bg-[#080808] text-bone"
        style={{ scrollSnapType: snapEnabled ? "y proximity" : "none" }}
      >
        <section
          ref={arrivalRef}
          className="relative flex min-h-[100svh] flex-col overflow-hidden px-5 pb-28 pt-16"
          style={{ scrollSnapAlign: "start" }}
        >
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(176,0,32,0.26),transparent_42%),linear-gradient(180deg,#111_0%,#080808_68%,#050505_100%)]" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link href="/" className="font-cinzel text-xs font-black uppercase tracking-[0.42em] text-offwhite">
              UNHOLY CO.
            </Link>
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone/45">
              Batch 001
            </span>
          </div>

          <div ref={canSlotRef} className="relative z-10 mt-7 h-[45svh] min-h-[18rem]">
            <Image
              src="/bloodthirst-hero-m.webp"
              alt="BloodThirst matte black aluminium can"
              fill
              priority
              sizes="100vw"
              className={`object-contain transition-opacity duration-500 ${canvasReady ? "opacity-0" : "opacity-100"}`}
            />
            <AnimatePresence>
              {canVisible && (
                <motion.div
                  key="mobile-canvas"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: canvasReady ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute inset-0"
                >
                  <DeferredMobileCanStage
                    onReady={() => {
                      setCanvasReady(true)
                      trackBloodthirstEvent("canvas_ready", {
                        canvas_ready_ms: Date.now() - mountAt.current,
                      })
                    }}
                    onFirstDrag={() => {
                      trackBloodthirstEvent("drag_interaction", {
                        pack_id: checkout.selected.id,
                      })
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative z-10 mt-auto">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-blood/90">
              Premium canned mountain water
            </p>
            <h1 className="mt-3 font-cinzel text-[3.25rem] font-black uppercase leading-[0.88] text-offwhite">
              Hydration for the Unholy.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-bone/70">
              500ml still water in a matte-black aluminium can. The water is innocent. The can is not.
            </p>
            <div className="mt-6 flex items-end justify-between gap-4 border-y border-bone/12 py-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/45">
                  Starts with
                </p>
                <p className="font-cinzel text-4xl font-black leading-none text-offwhite">
                  {money(FROM_PRICE)}
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToOffer}
                className="inline-flex shrink-0 items-center gap-2 bg-blood px-5 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.26em] text-offwhite shadow-[0_0_30px_rgba(176,0,32,0.35)] active:scale-[0.98]"
              >
                Buy
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        </section>

        <section
          ref={proofRef}
          className="relative flex min-h-[100svh] flex-col justify-center px-5 py-20"
          style={{ scrollSnapAlign: "start" }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-blood/90">
            Proof
          </p>
          <h2 className="mt-3 font-cinzel text-4xl font-black uppercase leading-tight text-offwhite">
            Don&apos;t be scared. It&apos;s just water.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-bone/66">
            Still natural mineral water. No sugar, caffeine, alcohol, or flavouring. The name is the costume.
          </p>
          <div className="mt-8 grid gap-px border border-bone/12 bg-bone/12">
            {PROOF_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-3 bg-black/58 px-4 py-4 text-sm text-bone/72">
                <span className="text-blood">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={scrollToOffer}
            className="mt-8 flex w-full items-center justify-center gap-2 border border-blood/45 bg-blood/14 px-5 py-4 text-sm font-bold uppercase text-offwhite active:scale-[0.98]"
          >
            Choose pack
            <ArrowDown size={15} />
          </button>
        </section>

        <section
          ref={offerRef}
          className="relative min-h-[100svh] px-5 pb-32 pt-16"
          onFocusCapture={() => setSnapEnabled(false)}
          onPointerDownCapture={() => setSnapEnabled(false)}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-blood/90">
            Offer
          </p>
          <h2 className="mt-3 font-cinzel text-4xl font-black uppercase leading-tight text-offwhite">
            Pick your poison. It&apos;s water.
          </h2>

          <div className="mt-7 grid gap-3">
            {PACKS.map((pack) => {
              const active = checkout.selected.id === pack.id
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => selectPack(pack)}
                  aria-pressed={active}
                  className={`grid grid-cols-[1fr_auto] items-end gap-4 border px-4 py-4 text-left active:scale-[0.99] ${
                    active
                      ? "border-blood bg-blood/18 ring-1 ring-blood/30"
                      : "border-bone/12 bg-black/42"
                  }`}
                >
                  <span>
                    <span className="block font-cinzel text-2xl font-black uppercase text-offwhite">
                      {pack.title}
                    </span>
                    <span className="mt-1 block text-sm text-bone/58">
                      {pack.qty} cans · ₹{pack.perCan}/can
                    </span>
                  </span>
                  <span className="font-cinzel text-3xl font-black text-offwhite">
                    {money(pack.price)}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5">
            <MobileAddOnsSheet
              open={addOnsOpen}
              onOpenChange={setAddOnsOpen}
              noteEnabled={noteEnabled}
              onNoteEnabledChange={setNoteEnabled}
              noteTone={noteTone}
              onNoteToneChange={setNoteTone}
              recipientName={recipientName}
              onRecipientNameChange={setRecipientName}
              noteContext={noteContext}
              onNoteContextChange={setNoteContext}
              ledgerEnabled={ledgerEnabled}
              onLedgerEnabledChange={setLedgerEnabled}
              ledgerName={ledgerName}
              onLedgerNameChange={setLedgerName}
              ledgerCity={ledgerCity}
              onLedgerCityChange={setLedgerCity}
              ledgerConfession={ledgerConfession}
              onLedgerConfessionChange={setLedgerConfession}
              ledgerConsent={ledgerConsent}
              onLedgerConsentChange={setLedgerConsent}
              onEngage={() => setSnapEnabled(false)}
            />
          </div>

          <div className="mt-6 border border-bone/12 bg-black/45 p-4">
            <div className="space-y-2 font-mono text-[11px] uppercase tracking-[0.18em] text-bone/62">
              <MobileLedgerRow label={`${checkout.selected.title} (${checkout.selected.qty} cans)`} value={money(checkout.selected.price)} />
              {checkoutAddOns.map((addOn) => (
                <MobileLedgerRow key={addOn.id} label={addOn.title} value={money(addOn.price)} />
              ))}
              <MobileLedgerRow label="Shipping" value="Free" accent />
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-bone/12 pt-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45">
                Total
              </span>
              <span className="font-cinzel text-4xl font-black text-offwhite">
                {money(checkout.pricing.total)}
              </span>
            </div>
          </div>

          <div className="mt-7">
            <RitualForm
              form={checkout.form}
              errors={checkout.errors}
              onChange={checkout.updateField}
              onBlur={checkout.blurField}
            />
          </div>

          <button
            type="button"
            onClick={checkout.sign}
            disabled={checkout.isSubmitting}
            className="mt-7 flex w-full items-center justify-center gap-2 bg-offwhite px-5 py-4 text-sm font-black uppercase text-black active:scale-[0.98] disabled:opacity-55"
          >
            <Lock size={16} />
            {checkout.isSubmitting ? "Opening Razorpay" : `Pay Securely — ${money(checkout.pricing.total)}`}
          </button>
          {checkout.payError && (
            <p className="mt-3 text-sm text-blood" role="alert">
              {checkout.payError}
            </p>
          )}
          <p className="mt-5 flex items-center gap-2 text-xs leading-relaxed text-bone/48">
            <Gift size={14} className="text-blood" />
            Razorpay secure · GST invoice · damage replacement.
          </p>
        </section>
      </main>

      <MobileBuyBar
        selected={checkout.selected}
        total={checkout.pricing.total}
        visible={barVisible}
        onTap={() => {
          trackBloodthirstEvent("sticky_buy_tap", {
            pack_id: checkout.selected.id,
            value: checkout.pricing.total,
            currency: "INR",
          })
          scrollToOffer()
        }}
      />
    </MotionConfig>
  )
}

function MobileLedgerRow({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0">{label}</span>
      <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-bone/25" />
      <span className={`shrink-0 tabular-nums ${accent ? "text-green-400" : "text-offwhite/80"}`}>
        {value}
      </span>
    </div>
  )
}
