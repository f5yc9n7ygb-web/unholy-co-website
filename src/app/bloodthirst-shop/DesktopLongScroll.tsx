"use client"

import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  ArrowDown,
  BadgeCheck,
  Check,
  ChevronDown,
  Gift,
  Lock,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react"

import { PACKS, type Pack } from "@/lib/shop/catalog"
import { CHECKOUT_ADD_ON_CONFIG, NOTE_TONES, type NoteTone } from "@/lib/shop/addon-config"
import { COMPANY_LEGAL_NAME, COMPANY_FSSAI_LICENSE } from "@/lib/site/company"
import type { ShippingForm } from "@/lib/shop/types"
import { RitualForm } from "./components/RitualForm"
import { BlackGloveModal, DoNotBuyModal } from "./components/PremiumInquiry"
import { useCheckoutAddOnDraft } from "./hooks/useCheckoutAddOnDraft"
import { useRitualCheckout, type AppliedPromo, type CheckoutAddOn } from "./hooks/useRitualCheckout"

type AddOnId = "cursed_note" | "unholy_ledger"

const NOTE_TEMPLATES: Record<NoteTone, string> = {
  Funny: "You looked dehydrated and emotionally expensive. Fix one of those.",
  Romantic: "I got you BloodThirst because flowers die and water has better survival instincts.",
  "Roast Them": "This is water. Something your personality could use more depth than.",
  "Beg Them To Come Back": "I was told not to text you. So I sent hydration with unresolved feelings.",
  "Send To Your Ex": "Not closure. Just colder than your replies.",
  "Surprise Me": "You didn't choose the note. So now the note has chosen violence.",
}

const REAL_CODE_MESSAGES: Record<string, string> = {
  SINNER: "₹66 off. Fine. You belong here.",
  PLEASE: "Begging detected. Mercy granted.",
  MOMSAIDNO: "Tell her we're sorry. Actually don't.",
  DAMNED: "The cult approves this poor decision.",
}

const FAKE_CODES: Record<string, string> = {
  FREEWATER: "₹0 off. Free water is called rain. Try outside.",
  PURE: "Rejected. Purity is a scam.",
  BROKE: "Financial exorcism failed. Try PLEASE for mercy.",
  REGRET: "Too late. You clicked the can.",
}

const TRUST_BUCKETS = [
  {
    title: "The Water",
    icon: <Sparkles size={18} />,
    body: "Premium mountain water. Zero sugar. Zero calories. No caffeine. It behaves better than you do.",
  },
  {
    title: "The Can",
    icon: <ShieldCheck size={18} />,
    body: "500 ml recyclable aluminium. Matte black. Engineered to be seen — in a fridge, on a desk, in a story.",
  },
  {
    title: "The Experience",
    icon: <Gift size={18} />,
    body: "Cursed notes, Ledger entries, gifting, and social moments. Hydration is the excuse, not the point.",
  },
] as const

const TRUST_SIGNALS = [
  "FSSAI licensed",
  "Secure Razorpay checkout",
  "24–48 hrs dispatch",
  "Damage / leak replacement",
  "Delivery across India",
  "Prepaid · GST invoice on request",
]

const FAQS: { question: string; answer: React.ReactNode }[] = [
  {
    question: "Is this just water?",
    answer:
      "Yes. Premium mountain water in a can with more personality than most bottled drinks. If you only want the cheapest hydration, this is not your aisle.",
  },
  {
    question: "Why is it priced like this?",
    answer:
      "Because this is not built like a ₹20 plastic bottle. You're paying for the can, the experience, the packaging, the brand, and the story you're going to pretend you didn't buy it for.",
  },
  {
    question: "When will my order ship?",
    answer:
      "Orders usually dispatch within 24–48 hours. Tracking is shared by email/SMS after dispatch.",
  },
  {
    question: "What if cans arrive damaged or leaking?",
    answer: (
      <>
        We replace damaged or leaked cans. See our{" "}
        <Link href="/refund" className="text-blood underline decoration-blood/40 underline-offset-4 hover:text-offwhite">
          refund / replacement policy
        </Link>
        .
      </>
    ),
  },
  {
    question: "Is BloodThirst FSSAI licensed?",
    answer: (
      <>
        Yes. FSSAI and legal details are printed on the pack and on our{" "}
        <Link href="/legal" className="text-blood underline decoration-blood/40 underline-offset-4 hover:text-offwhite">
          legal page
        </Link>
        .
      </>
    ),
  },
  {
    question: "Can I gift it?",
    answer: "Yes. Add a Cursed Note and make someone's day slightly worse.",
  },
  {
    question: "What is the Unholy Ledger?",
    answer:
      "A public digital archive of customers who voluntarily enter their name or handle after purchase. Consent required. Regret optional.",
  },
  {
    question: "Is Black Glove Delivery real?",
    answer:
      "Unfortunately, yes. Subject to location and feasibility. We'll contact you before accepting the ritual.",
  },
]

const PRIMARY_PACKS = PACKS.filter((pack) => pack.id !== "pack24")
const STOCK_PACK = PACKS.find((pack) => pack.id === "pack24")

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

export function DesktopLongScroll({ razorpayKey }: { razorpayKey?: string }) {
  const heroRef = useRef<HTMLElement>(null)
  const packRef = useRef<HTMLElement>(null)
  const purchaseRef = useRef<HTMLDivElement>(null)
  const checkoutRef = useRef<HTMLElement>(null)

  const [expandedAddOn, setExpandedAddOn] = useState<AddOnId | null>(null)
  const {
    noteEnabled, setNoteEnabled, ledgerEnabled, setLedgerEnabled,
    noteTone, setNoteTone, recipientName, setRecipientName,
    noteContext, setNoteContext, ledgerName, setLedgerName,
    ledgerCity, setLedgerCity, ledgerConfession, setLedgerConfession,
    ledgerConsent, setLedgerConsent, checkoutAddOns,
  } = useCheckoutAddOnDraft()
  const [codeInput, setCodeInput] = useState("")
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeMessage, setCodeMessage] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [blackGloveOpen, setBlackGloveOpen] = useState(false)
  const [doNotBuyOpen, setDoNotBuyOpen] = useState(false)
  const [mobileBarBlocked, setMobileBarBlocked] = useState(true)

  const checkout = useRitualCheckout({
    razorpayKey,
    defaultPackId: "pack3",
    checkoutAddOns,
  })
  const { goToReceipt, isSealed } = checkout

  useEffect(() => {
    if (isSealed) goToReceipt()
  }, [goToReceipt, isSealed])

  useEffect(() => {
    if (typeof window === "undefined") return
    const targets = [heroRef.current, purchaseRef.current, checkoutRef.current].filter(Boolean) as Element[]
    if (!targets.length) return

    const visible = new Map<Element, boolean>()
    const update = () => setMobileBarBlocked(targets.some((target) => visible.get(target)))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting))
      update()
    }, {
      rootMargin: "-64px 0px -88px 0px",
      threshold: 0.01,
    })

    targets.forEach((target) => {
      visible.set(target, false)
      observer.observe(target)
    })

    return () => observer.disconnect()
  }, [])

  const scrollBehavior = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
  const scrollToPacks = () => packRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" })
  const scrollToCheckout = () => checkoutRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" })

  const applyCode = async (forcedCode?: string) => {
    const code = (forcedCode || codeInput).trim().toUpperCase()
    if (!code || codeLoading) return

    setCodeInput(code)
    setCodeMessage(null)
    setCodeError(null)

    if (code === "CHEAP") {
      checkout.removePromo()
      setCodeMessage("BloodThirst does not respond well to disrespect. Try PLEASE if you're desperate.")
      return
    }

    if (FAKE_CODES[code]) {
      checkout.removePromo()
      setCodeMessage(FAKE_CODES[code])
      return
    }

    setCodeLoading(true)
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderTotal: checkout.grossTotal }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setCodeError(data?.error || "That code refused the ritual.")
        return
      }
      const promo: AppliedPromo = {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
        promoRecordId: data.promoRecordId,
      }
      checkout.applyPromo(promo)
      setCodeInput("")
      setCodeMessage(REAL_CODE_MESSAGES[promo.code] || `${money(promo.discountAmount)} off. Accepted.`)
    } catch {
      setCodeError("Unable to validate code right now.")
    } finally {
      setCodeLoading(false)
    }
  }

  const choosePack = (pack: Pack) => {
    checkout.selectPack(pack)
    checkout.removePromo()
    setCodeMessage(null)
    setCodeError(null)
  }

  const removeAddOn = (id: CheckoutAddOn["id"]) => {
    if (id === "cursed_note") setNoteEnabled(false)
    else if (id === "unholy_ledger") setLedgerEnabled(false)
  }

  const selectTrialAndReturn = () => {
    const trial = PACKS.find((pack) => pack.id === "pack3")
    if (trial) choosePack(trial)
    setDoNotBuyOpen(false)
    scrollToPacks()
  }

  return (
    <div>
      <Script
        key="razorpay-checkout"
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-[#090909] text-bone">
        <div aria-hidden className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(176,0,32,0.20),transparent_35%),linear-gradient(180deg,#111_0%,#090909_50%,#050505_100%)]" />
        <div aria-hidden className="pointer-events-none fixed inset-0 opacity-[0.04]" style={{ backgroundImage: "url('/bloodthirst-texture.webp')" }} />

        <header className="fixed inset-x-0 top-0 z-40 border-b border-bone/10 bg-[#090909]/85 px-5 py-4 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <Link href="/" className="font-cinzel text-sm font-black uppercase text-offwhite">
              UNHOLY CO.
            </Link>
            <nav className="hidden items-center gap-5 text-xs text-bone/55 md:flex">
              <button type="button" onClick={scrollToPacks} className="transition-colors hover:text-offwhite">Packs</button>
              <a href="#addons" className="transition-colors hover:text-offwhite">Add-ons</a>
              <a href="#faq" className="transition-colors hover:text-offwhite">FAQ</a>
              <Link href="/unholy-ledger" className="transition-colors hover:text-offwhite">Ledger</Link>
            </nav>
            <button
              type="button"
              onClick={scrollToPacks}
              className="inline-flex items-center gap-2 border border-blood/50 bg-blood/15 px-4 py-2 text-xs font-semibold uppercase text-offwhite transition-colors hover:bg-blood/25"
            >
              Try From ₹299
              <ArrowDown size={14} />
            </button>
          </div>
        </header>

        <div className="relative z-10">
          <section ref={heroRef} className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-12 pt-24 md:min-h-screen md:gap-10 md:pb-16 md:pt-28 md:grid-cols-[1fr_0.82fr] md:px-8 lg:gap-16">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex border border-blood/35 bg-blood/10 px-3 py-1 text-xs uppercase text-blood">
                Premium canned mountain water
              </p>
              <h1 className="font-cinzel text-5xl font-black uppercase leading-[0.95] text-offwhite md:text-7xl">
                Hydration for the Unholy.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-bone/70 md:mt-6 md:text-lg">
                BloodThirst is premium mountain water sealed in a can built for stories, stares, and people who refuse to hydrate normally.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={scrollToPacks}
                  className="inline-flex items-center justify-center gap-2 bg-offwhite px-6 py-4 text-sm font-bold uppercase text-black transition-transform hover:-translate-y-0.5"
                >
                  Choose Your Sin
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const single = PACKS.find((pack) => pack.id === "pack1")
                    if (single) choosePack(single)
                    scrollToCheckout()
                  }}
                  className="inline-flex items-center justify-center border border-bone/20 px-6 py-4 text-sm font-bold uppercase text-offwhite transition-colors hover:border-blood/60"
                >
                  Start with 1 can from ₹299
                </button>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-px border border-bone/10 bg-bone/10 text-center">
                {["500 ml", "Zero sugar", "India delivery"].map((item) => (
                  <span key={item} className="bg-black/55 px-3 py-3 text-xs text-bone/65">
                    {item}
                  </span>
                ))}
              </div>
              <TrustStrip className="mt-5 justify-center lg:hidden" />
            </div>

            <div className="relative order-first mx-auto flex w-full max-w-[16rem] justify-center md:order-none md:max-w-md">
              <div className="absolute inset-x-8 bottom-8 h-32 rounded-full bg-blood/25 blur-3xl" aria-hidden />
              <Image
                src="/bloodthirst-hero.webp"
                alt="BloodThirst canned water"
                width={760}
                height={960}
                priority
                sizes="(min-width: 768px) 40vw, 60vw"
                className="relative h-auto max-h-[38vh] w-auto object-contain drop-shadow-[0_40px_90px_rgba(0,0,0,0.65)] md:max-h-[68vh]"
              />
            </div>
          </section>

          <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-28 md:px-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14 lg:items-start">
            {/* Purchase zone — packs, add-ons, code. Sits first on mobile, top-left on desktop. */}
            <div ref={purchaseRef} className="space-y-16 md:space-y-24 lg:space-y-28 lg:col-start-1 lg:row-start-1">
              <section ref={packRef} id="packs" className="scroll-mt-24">
                <SectionHeader
                  eyebrow="Pack selector"
                  title="Choose Your Sin"
                  body="Lower-friction entries for first-time sinners. The 6-pack stays the real initiation."
                />
                <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {PRIMARY_PACKS.map((pack) => (
                    <PackCard key={pack.id} pack={pack} selected={checkout.selected.id === pack.id} onSelect={() => choosePack(pack)} />
                  ))}
                </div>
                {STOCK_PACK && (
                  <button
                    type="button"
                    onClick={() => choosePack(STOCK_PACK)}
                    aria-pressed={checkout.selected.id === STOCK_PACK.id}
                    className={`mt-4 flex w-full flex-col justify-between gap-4 border p-5 text-left transition-colors sm:mt-5 sm:flex-row sm:items-center ${
                      checkout.selected.id === STOCK_PACK.id
                        ? "border-blood bg-blood/[0.16] ring-1 ring-blood/40"
                        : "border-bone/12 bg-black/35 hover:border-bone/30"
                    }`}
                  >
                    <span>
                      <span className="block font-cinzel text-2xl font-black uppercase text-offwhite">{STOCK_PACK.title}</span>
                      <span className="mt-1 block text-sm text-bone/58">{STOCK_PACK.qty} cans. {STOCK_PACK.blurb}</span>
                    </span>
                    <span className="text-left sm:text-right">
                      <span className="block font-cinzel text-3xl font-black text-offwhite">{money(STOCK_PACK.price)}</span>
                      <span className="text-xs text-bone/45">{money(STOCK_PACK.perCan)}/can</span>
                    </span>
                  </button>
                )}
                <TrustStrip className="mt-6 justify-center border-t border-bone/10 pt-5" />
                <button
                  type="button"
                  onClick={() => {
                    setExpandedAddOn("cursed_note")
                    document.getElementById("addons")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 text-xs uppercase tracking-wide text-bone/55 transition-colors hover:text-offwhite"
                >
                  <Gift size={14} className="text-blood" /> Sending it to someone? Add a Cursed Note →
                </button>
              </section>

              <section id="addons" className="scroll-mt-24">
                <SectionHeader
                  eyebrow="Add-ons"
                  title="Make It Worse"
                  body="Optional upgrades for people who think normal checkout is too pure."
                />
                <div className="mt-8 space-y-3">
                  <AddOnShell
                    title={CHECKOUT_ADD_ON_CONFIG.cursed_note.title}
                    price={CHECKOUT_ADD_ON_CONFIG.cursed_note.price}
                    icon={<Gift size={18} />}
                    open={expandedAddOn === "cursed_note"}
                    enabled={noteEnabled}
                    summary="Add a note that should not have passed HR."
                    cta="Add Cursed Note"
                    onOpen={() => setExpandedAddOn(expandedAddOn === "cursed_note" ? null : "cursed_note")}
                    onToggle={() => {
                      const next = !noteEnabled
                      setNoteEnabled(next)
                      if (next) setExpandedAddOn("cursed_note")
                    }}
                  >
                    <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                      <div>
                        <FieldLabel>Choose note type</FieldLabel>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {NOTE_TONES.map((tone) => (
                            <button
                              key={tone}
                              type="button"
                              onClick={() => setNoteTone(tone)}
                              className={`border px-3 py-2 text-left text-xs transition-colors ${
                                noteTone === tone ? "border-blood bg-blood/15 text-offwhite" : "border-bone/12 text-bone/62 hover:border-bone/35"
                              }`}
                            >
                              {tone}
                            </button>
                          ))}
                        </div>
                        <div className="mt-4">
                          <FieldLabel htmlFor="recipientName">Recipient name</FieldLabel>
                          <input
                            id="recipientName"
                            value={recipientName}
                            onChange={(event) => setRecipientName(event.target.value)}
                            placeholder="Name of the sinner receiving this"
                            className="mt-2 w-full border border-bone/15 bg-black/60 px-4 py-3 text-sm text-offwhite outline-none focus:border-blood"
                          />
                        </div>
                        <div className="mt-4">
                          <FieldLabel htmlFor="noteContext">Extra context</FieldLabel>
                          <textarea
                            id="noteContext"
                            value={noteContext}
                            onChange={(event) => setNoteContext(event.target.value)}
                            placeholder="Tell us just enough to cause tasteful damage. Nothing legally worrying."
                            rows={4}
                            className="mt-2 w-full resize-none border border-bone/15 bg-black/60 px-4 py-3 text-sm text-offwhite outline-none focus:border-blood"
                          />
                        </div>
                      </div>
                      <div className="border border-bone/12 bg-black/45 p-5">
                        <p className="text-xs uppercase text-blood">Preview</p>
                        <p className="mt-4 text-lg leading-relaxed text-offwhite">&ldquo;{NOTE_TEMPLATES[noteTone]}&rdquo;</p>
                        <p className="mt-5 text-sm text-bone/48">
                          We&apos;ll keep it sharp, funny, and safe. No genuine threats, hate, or harassment.
                        </p>
                      </div>
                    </div>
                  </AddOnShell>

                  <AddOnShell
                    title={CHECKOUT_ADD_ON_CONFIG.unholy_ledger.title}
                    price={CHECKOUT_ADD_ON_CONFIG.unholy_ledger.price}
                    icon={<BadgeCheck size={18} />}
                    open={expandedAddOn === "unholy_ledger"}
                    enabled={ledgerEnabled && ledgerConsent}
                    summary="Put your name in the Unholy Ledger. Permanently. Unfortunately."
                    cta="Enter the Ledger"
                    onOpen={() => setExpandedAddOn(expandedAddOn === "unholy_ledger" ? null : "unholy_ledger")}
                    onToggle={() => {
                      const next = !ledgerEnabled
                      setLedgerEnabled(next)
                      if (next) setExpandedAddOn("unholy_ledger")
                    }}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Display name or Instagram handle" value={ledgerName} onChange={setLedgerName} placeholder="@unholy_sinner" />
                      <TextInput label="City" value={ledgerCity} onChange={setLedgerCity} placeholder="Jaipur" />
                      <div className="md:col-span-2">
                        <FieldLabel htmlFor="ledgerConfession">Optional confession</FieldLabel>
                        <textarea
                          id="ledgerConfession"
                          value={ledgerConfession}
                          onChange={(event) => setLedgerConfession(event.target.value)}
                          placeholder="I said I was just curious. I lied."
                          rows={3}
                          className="mt-2 w-full resize-none border border-bone/15 bg-black/60 px-4 py-3 text-sm text-offwhite outline-none focus:border-blood"
                        />
                      </div>
                      <label className="flex gap-3 border border-bone/12 bg-black/35 p-4 text-sm leading-relaxed text-bone/66 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={ledgerConsent}
                          onChange={(event) => setLedgerConsent(event.target.checked)}
                          className="mt-1 h-4 w-4 accent-blood"
                        />
                        <span>I allow BloodThirst to publicly display my chosen name/handle, city, and confession in The Unholy Ledger.</span>
                      </label>
                      {ledgerEnabled && !ledgerConsent && (
                        <p className="text-sm text-blood md:col-span-2">
                          Ledger entry is not added to the cart until consent is checked.
                        </p>
                      )}
                    </div>
                  </AddOnShell>

                  <div className="border border-blood/25 bg-gradient-to-br from-blood/14 to-black/50 p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <p className="inline-flex border border-blood/35 px-2 py-1 text-xs uppercase text-blood">Black Glove Delivery</p>
                        <h3 className="mt-3 font-cinzel text-2xl font-black uppercase text-offwhite">₹1,00,000</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone/62">
                          Founder-delivered BloodThirst. Judgement included. Dignity not guaranteed.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBlackGloveOpen(true)}
                        className="inline-flex items-center justify-center border border-blood/45 bg-blood/12 px-5 py-3 text-sm font-bold uppercase text-offwhite transition-colors hover:bg-blood/22"
                      >
                        View Breakdown
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader eyebrow="Forbidden code" title="Try a Forbidden Code" />
                <div className="mt-6 border border-bone/12 bg-black/45 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={codeInput}
                      aria-label="Promo code"
                      onChange={(event) => {
                        setCodeInput(event.target.value.toUpperCase())
                        setCodeError(null)
                        setCodeMessage(null)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") applyCode()
                      }}
                      placeholder="Enter code"
                      className="min-w-0 flex-1 border border-bone/15 bg-black/70 px-4 py-3 text-sm uppercase text-offwhite outline-none focus:border-blood"
                    />
                    <button
                      type="button"
                      onClick={() => applyCode()}
                      disabled={codeLoading || !codeInput.trim()}
                      className="inline-flex items-center justify-center bg-offwhite px-5 py-3 text-sm font-bold uppercase text-black disabled:opacity-50"
                    >
                      {codeLoading ? "Trying" : "Apply"}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["SINNER", "PLEASE", "PURE", "FREEWATER", "CHEAP"].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => applyCode(code)}
                        className="border border-bone/12 px-3 py-1.5 text-xs uppercase text-bone/52 transition-colors hover:border-blood/45 hover:text-offwhite"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                  {checkout.appliedPromo && (
                    <div className="mt-4 flex items-center justify-between gap-3 border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                      <span>{checkout.appliedPromo.code} applied. Saves {money(checkout.appliedPromo.discountAmount)}.</span>
                      <button type="button" onClick={checkout.removePromo} className="text-xs uppercase text-bone/70 hover:text-offwhite">Remove</button>
                    </div>
                  )}
                  <div role="status" aria-live="polite">
                    {codeMessage && <p className="mt-3 text-sm text-bone/68">{codeMessage}</p>}
                    {codeError && <p className="mt-3 text-sm text-blood">{codeError}</p>}
                  </div>
                </div>
              </section>
            </div>

            {/* Checkout — physically between Purchase and Theatre, so on mobile it lands right
                after the buy decision. On desktop, grid placement floats it into the sticky sidebar. */}
            <aside ref={checkoutRef} className="scroll-mt-24 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-24">
              <CartPanel
                selected={checkout.selected}
                addOns={checkoutAddOns}
                onRemoveAddOn={removeAddOn}
                discount={checkout.appliedPromo}
                total={checkout.pricing.total}
                form={checkout.form}
                errors={checkout.errors}
                onChange={checkout.updateField}
                onBlur={checkout.blurField}
                onSign={checkout.sign}
                isSubmitting={checkout.isSubmitting}
                payError={checkout.payError}
              />
            </aside>

            {/* Theatre zone — trust world, lore, FAQ. Lower on mobile, bottom-left on desktop. */}
            <div className="space-y-16 md:space-y-24 lg:space-y-28 lg:col-start-1 lg:row-start-2">
              <section>
                <SectionHeader eyebrow="Trust" title="What You're Actually Getting" body="Still water. Sharper packaging. A registered company behind every can." />
                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  {TRUST_BUCKETS.map((bucket) => (
                    <div key={bucket.title} className="border border-bone/12 bg-black/45 p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center border border-bone/15 text-blood">{bucket.icon}</span>
                        <h3 className="font-cinzel text-xl font-black uppercase text-offwhite">{bucket.title}</h3>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-bone/64">{bucket.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-3">
                  {TRUST_SIGNALS.map((signal, index) => (
                    <div key={signal} className="flex items-center gap-3 bg-black/55 p-4 text-sm text-bone/68">
                      {index % 3 === 0 && <ShieldCheck size={16} className="text-blood" />}
                      {index % 3 === 1 && <Sparkles size={16} className="text-[#c9a96a]" />}
                      {index % 3 === 2 && <Truck size={16} className="text-bone/50" />}
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <SectionHeader eyebrow="Bad decisions" title="For People Beyond Saving" />
                <div className="mt-8 border border-blood/30 bg-[#120608] p-6 md:p-8">
                  <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                      <p className="text-xs uppercase text-blood">Do Not Buy This</p>
                      <h3 className="mt-2 font-cinzel text-4xl font-black uppercase text-offwhite">₹66,666</h3>
                      <p className="mt-4 max-w-2xl text-base leading-relaxed text-bone/66">
                        666 cans. Signed crate. Ledger entry. Founder judgement. A financial decision your ancestors did not survive for.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDoNotBuyOpen(true)}
                      className="inline-flex items-center justify-center border border-blood/45 bg-blood/15 px-5 py-3 text-sm font-bold uppercase text-offwhite transition-colors hover:bg-blood/25"
                    >
                      Ignore Our Advice
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <SectionHeader
                  eyebrow="Ledger preview"
                  title="The Unholy Ledger"
                  body="A public record of people who paid money for cursed hydration and lived to tell the tale."
                />
                <p className="mt-4 inline-flex border border-bone/15 bg-black/40 px-3 py-1 text-xs uppercase tracking-wide text-bone/55">
                  Example entries · Real sinners appear after launch
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {[
                    ["Aakash", "Jaipur", "Trial Ritual", "I said I was just curious. I lied."],
                    ["@midnightdesk", "Mumbai", "The Possession", "The fridge looked too innocent."],
                    ["R.", "Delhi", "Single Sin", "Bought it for the story. Kept the can."],
                  ].map(([name, city, pack, confession]) => (
                    <div key={`${name}-${city}`} className="border border-bone/12 bg-black/42 p-5">
                      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-bone/35">Example entry</p>
                      <p className="font-cinzel text-xl font-black uppercase text-offwhite">{name} - {city}</p>
                      <p className="mt-3 text-xs text-bone/45">Initiated: 10 June 2026</p>
                      <p className="mt-1 text-xs text-bone/45">Pack: {pack}</p>
                      <p className="mt-4 text-sm leading-relaxed text-bone/65">&ldquo;{confession}&rdquo;</p>
                    </div>
                  ))}
                </div>
                <Link href="/unholy-ledger" className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase text-blood hover:text-offwhite">
                  View the Ledger <Send size={15} />
                </Link>
              </section>

              <section id="faq" className="scroll-mt-24">
                <SectionHeader eyebrow="FAQ" title="Questions Before The Ritual" />
                <div className="mt-8 divide-y divide-bone/10 border-y border-bone/10">
                  {FAQS.map((faq) => (
                    <details key={faq.question} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-cinzel text-lg font-black uppercase text-offwhite">
                        {faq.question}
                        <ChevronDown size={18} className="shrink-0 transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bone/62">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>

              <section className="pb-4">
                <div className="border border-bone/12 bg-offwhite px-6 py-10 text-black md:px-10">
                  <p className="text-xs font-bold uppercase text-blood">Final CTA</p>
                  <h2 className="mt-3 font-cinzel text-4xl font-black uppercase leading-tight md:text-5xl">
                    Water, but make it a bad decision.
                  </h2>
                  <button
                    type="button"
                    onClick={scrollToCheckout}
                    className="mt-7 inline-flex items-center justify-center gap-2 bg-black px-6 py-4 text-sm font-bold uppercase text-offwhite"
                  >
                    Go to Checkout
                    <ArrowDown size={16} />
                  </button>
                  <p className="mt-5 text-xs uppercase tracking-wide text-black/55">
                    FSSAI Licensed · 24–48 hrs dispatch · Damage replacement · Secure Razorpay
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>

        <MobileCartBar
          selected={checkout.selected}
          total={checkout.pricing.total}
          onClick={scrollToCheckout}
          visible={!mobileBarBlocked}
        />
      </div>

      {blackGloveOpen && <BlackGloveModal onClose={() => setBlackGloveOpen(false)} />}

      {doNotBuyOpen && <DoNotBuyModal onClose={() => setDoNotBuyOpen(false)} onTakeTrial={selectTrialAndReturn} />}
    </div>
  )
}

function TrustStrip({ className = "" }: { className?: string }) {
  const items = ["FSSAI Licensed", "24–48 hrs dispatch", "Damage replacement", "Secure Razorpay"]
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-bone/55">
          {index > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-blood/60" />}
          {item}
        </span>
      ))}
    </div>
  )
}

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-blood">
        <span aria-hidden className="h-px w-6 bg-blood/60" />
        {eyebrow}
      </p>
      <h2 className="mt-4 font-cinzel text-3xl font-black uppercase leading-[1.05] tracking-tight text-offwhite md:text-4xl">{title}</h2>
      {body && <p className="mt-4 max-w-xl text-base leading-relaxed text-bone/55">{body}</p>}
    </div>
  )
}

function PackCard({ pack, selected, onSelect }: { pack: Pack; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex w-full flex-row items-center gap-4 border p-4 text-left transition-colors md:min-h-[19rem] md:flex-col md:items-stretch md:gap-0 md:p-6 ${
        selected ? "border-blood bg-blood/[0.16] ring-1 ring-blood/40" : "border-bone/12 bg-black/42 hover:border-bone/32"
      }`}
    >
      <div className="min-w-0 flex-1 md:flex-none">
        {pack.tag && (
          <span className="mb-2 inline-flex w-fit border border-[#c9a96a]/40 bg-[#c9a96a]/10 px-2 py-0.5 text-[10px] uppercase text-[#d8bd82] md:mb-4 md:py-1 md:text-xs">
            {pack.tag}
          </span>
        )}
        <span className="block font-cinzel text-xl font-black uppercase text-offwhite md:text-2xl">{pack.title}</span>
        <span className="mt-1 block text-sm text-bone/50 md:mt-2">{pack.qty} {pack.qty === 1 ? "can" : "cans"}</span>
        <span className="mt-1 hidden text-sm leading-relaxed text-bone/64 md:mt-5 md:block">{pack.blurb}</span>
      </div>
      <div className="shrink-0 text-right md:mt-5 md:text-left">
        <span className="block font-cinzel text-2xl font-black text-offwhite md:text-4xl">{money(pack.price)}</span>
        <span className="text-xs text-bone/45">{money(pack.perCan)}/can</span>
      </div>
      <span className="mt-auto hidden pt-5 text-sm font-bold uppercase text-blood md:block">{selected ? "Selected" : "Select Pack"}</span>
      {selected && <Check className="absolute right-3 top-3 hidden text-blood md:block md:right-4 md:top-4" size={18} />}
    </button>
  )
}

function AddOnShell({
  title,
  price,
  icon,
  open,
  enabled,
  summary,
  cta,
  onOpen,
  onToggle,
  children,
}: {
  title: string
  price: number
  icon: React.ReactNode
  open: boolean
  enabled: boolean
  summary: string
  cta: string
  onOpen: () => void
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className={`border bg-black/45 transition-colors ${enabled ? "border-blood/60" : "border-bone/12"}`}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onOpen} className="flex flex-1 items-center gap-4 text-left">
          <span className="flex h-10 w-10 items-center justify-center border border-bone/15 text-blood">{icon}</span>
          <span>
            <span className="block font-cinzel text-xl font-black uppercase text-offwhite">{title} - {money(price)}</span>
            <span className="mt-1 block text-sm text-bone/58">{summary}</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={enabled}
            title={enabled ? "Remove from order" : undefined}
            className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${
              enabled ? "bg-blood text-offwhite hover:bg-blood/80" : "border border-bone/16 text-offwhite hover:border-blood/50"
            }`}
          >
            {enabled ? `Added — ${money(price)} · Remove` : cta}
          </button>
          <button type="button" onClick={onOpen} aria-label={`Toggle ${title}`} className="p-2 text-bone/55 hover:text-offwhite">
            <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {open && <div className="border-t border-bone/10 p-5">{children}</div>}
    </div>
  )
}

function CartPanel({
  selected,
  addOns,
  onRemoveAddOn,
  discount,
  total,
  form,
  errors,
  onChange,
  onBlur,
  onSign,
  isSubmitting,
  payError,
}: {
  selected: Pack
  addOns: CheckoutAddOn[]
  onRemoveAddOn: (id: CheckoutAddOn["id"]) => void
  discount: AppliedPromo | null
  total: number
  form: ShippingForm
  errors: Partial<Record<keyof ShippingForm, string>>
  onChange: (field: keyof ShippingForm, value: string) => void
  onBlur: (field: keyof ShippingForm) => void
  onSign: () => void
  isSubmitting: boolean
  payError: string | null
}) {
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (deliveryOpen) onSign()
        else setDeliveryOpen(true)
      }}
      className="border border-bone/12 bg-[#050505]/95 p-6 shadow-2xl shadow-black/30 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto"
    >
      <p className="text-xs font-bold uppercase text-blood">Your Sin</p>
      <div className="mt-4 space-y-3 text-sm text-bone/70">
        <CartRow label={selected.title} value={money(selected.price)} />
        {addOns.map((item) => (
          <div key={item.id} className="flex justify-between gap-4">
            <span className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onRemoveAddOn(item.id)}
                aria-label={`Remove ${item.title}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center text-bone/55 transition-colors hover:text-blood"
              >
                <X size={13} />
              </button>
              <span className="truncate">{item.title}</span>
            </span>
            <span className="text-offwhite">{money(item.price)}</span>
          </div>
        ))}
        {discount && <CartRow label={`Code ${discount.code}`} value={`-${money(discount.discountAmount)}`} accent />}
        <CartRow label="Shipping" value="Free" accent />
      </div>
      <div className="mt-5 border-t border-bone/10 pt-5">
        <div className="flex items-end justify-between gap-4">
          <span className="text-xs uppercase text-bone/45">Total</span>
          <span className="font-cinzel text-4xl font-black text-offwhite">{money(total)}</span>
        </div>
        <p className="mt-2 text-xs text-bone/42">Incl. all taxes · Regret ships separately.</p>
      </div>
      <TrustStrip className="mt-5 justify-center border-y border-bone/10 py-4" />
      {deliveryOpen ? (
        <>
          <div className="mt-6 pt-1">
            <p className="mb-4 text-xs font-bold uppercase text-bone/55">Delivery details</p>
            <RitualForm form={form} errors={errors} onChange={onChange} onBlur={onBlur} />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-offwhite px-5 py-4 text-sm font-black uppercase text-black transition-transform hover:-translate-y-0.5 disabled:opacity-55"
          >
            <Lock size={16} />
            {isSubmitting ? "Opening Razorpay" : `Pay Securely — ${money(total)}`}
          </button>
          {payError && <p className="mt-3 text-sm text-blood" role="alert">{payError}</p>}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setDeliveryOpen(true)}
          className="mt-6 flex w-full items-center justify-center gap-2 bg-offwhite px-5 py-4 text-sm font-black uppercase text-black transition-transform hover:-translate-y-0.5"
        >
          Continue to Delivery
          <ArrowDown size={16} />
        </button>
      )}
      <div className="mt-5 grid grid-cols-3 gap-px border border-bone/10 bg-bone/10 text-center text-[11px] text-bone/52">
        {["secure", "prepaid", "gst invoice"].map((item) => <span key={item} className="bg-black/60 px-2 py-2 uppercase">{item}</span>)}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-bone/50">
        Damaged or leaked cans?{" "}
        <Link href="/refund" className="text-bone/75 underline decoration-bone/30 underline-offset-4 hover:text-offwhite">
          We replace them.
        </Link>{" "}
        ·{" "}
        <Link href="/track" className="text-bone/75 underline decoration-bone/30 underline-offset-4 hover:text-offwhite">
          Already ordered? Track here.
        </Link>
      </p>
      <div className="mt-4 border-t border-bone/10 pt-4 text-[11px] leading-relaxed text-bone/40">
        <p>Sold by {COMPANY_LEGAL_NAME}</p>
        <p className="mt-1">
          FSSAI: {COMPANY_FSSAI_LICENSE} ·{" "}
          <Link href="/legal" className="text-bone/65 underline decoration-bone/25 underline-offset-4 hover:text-offwhite">
            Legal details
          </Link>
        </p>
      </div>
    </form>
  )
}

function MobileCartBar({
  selected,
  total,
  onClick,
  visible,
}: {
  selected: Pack
  total: number
  onClick: () => void
  visible: boolean
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-bone/12 bg-[#050505]/95 px-3 pt-2.5 backdrop-blur-md transition-[opacity,transform] duration-200 lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
    >
      <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-4 bg-offwhite px-4 py-3 text-left text-black">
        <span>
          <span className="block text-xs uppercase text-black/55">{selected.title}</span>
          <span className="flex items-center gap-1 font-bold">Go to checkout <ArrowDown size={14} /></span>
        </span>
        <span className="font-cinzel text-2xl font-black">{money(total)}</span>
      </button>
    </div>
  )
}

function CartRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className={accent ? "text-green-300" : "text-offwhite"}>{value}</span>
    </div>
  )
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="text-xs font-bold uppercase text-bone/52">{children}</label>
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  const id = `addon-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border border-bone/15 bg-black/60 px-4 py-3 text-sm text-offwhite outline-none focus:border-blood"
      />
    </div>
  )
}
