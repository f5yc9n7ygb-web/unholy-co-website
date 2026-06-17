"use client"

import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronDown,
  Droplets,
  Lock,
  ShieldCheck,
  Star,
  Truck,
  X,
} from "lucide-react"

import { PACKS, type Pack } from "@/lib/shop/catalog"
import { generateEventId, trackPixel } from "@/lib/meta-pixel"
import type { ShippingForm } from "@/lib/shop/types"

declare global {
  interface Window {
    Razorpay: any
  }
}

type FormErrors = Partial<Record<keyof ShippingForm, string>>

type AppliedPromo = {
  code: string
  discountType: "percentage" | "flat"
  discountValue: number
  discountAmount: number
  finalPrice: number
  promoRecordId: string
}

type Pricing = {
  grossTotal: number
  discountAmount: number
  subtotal: number
  gstAmount: number
  total: number
}

const GST_RATE = 0.05
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Chandigarh",
  "Puducherry",
]

const EMPTY_FORM: ShippingForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  pincode: "",
  state: "",
  gstNumber: "",
  gstBusinessName: "",
}

const HERO_FACTS = [
  "500ml canned water",
  "Still natural mineral water",
  "No sugar. No sweeteners.",
  "Recyclable aluminium can",
]

const TRUST_MARKERS = [
  { icon: Lock, label: "Secure Razorpay checkout" },
  { icon: Truck, label: "Free shipping across India" },
  { icon: ShieldCheck, label: "GST invoice available" },
]

const REASONS = [
  {
    title: "Water, not wellness theatre.",
    body: "Still natural mineral water in a 500ml can. Clean, cold, direct. No fake monk energy required.",
  },
  {
    title: "Plastic had a long enough reign.",
    body: "Aluminium is widely recycled and built for colder, harder looking hydration.",
  },
  {
    title: "It looks like it has a problem with boring rooms.",
    body: "Designed for desks, parties, studios, gyms, shoots, and any fridge that deserves better lighting.",
  },
]

const COMPARISON = [
  ["Container", "Plastic bottle", "Matte-black aluminium can"],
  ["Vibe", "Airport waiting area", "Backstage cult refreshment"],
  ["Taste profile", "Still water", "Still natural mineral water"],
  ["Afterlife", "Questionable", "Widely recyclable"],
]

const REVIEWS = [
  {
    quote: "Looks illegal. Tastes like water. Somehow that is exactly the point.",
    name: "Early acolyte",
  },
  {
    quote: "Finally a water can that does not look like it apologizes for existing.",
    name: "Studio fridge witness",
  },
  {
    quote: "Bought it for the can. Reordered because everyone kept stealing them.",
    name: "Repeat sinner",
  },
]

const FAQS = [
  {
    question: "What exactly is BloodThirst?",
    answer:
      "BloodThirst is 500ml still natural mineral water in a recyclable aluminium can. It is water, dressed for bad decisions.",
  },
  {
    question: "Is it sparkling?",
    answer:
      "No. This first drop is still water. No fizz, no sugar, no sweeteners, no flavouring.",
  },
  {
    question: "Why put water in a can?",
    answer:
      "Because plastic bottled water is visually dead and environmentally tired. Cans feel colder, look sharper, and aluminium has a strong recycling stream.",
  },
  {
    question: "How fast can I buy?",
    answer:
      "Choose a pack, enter shipping details, and pay through Razorpay. Your receipt opens after payment verification.",
  },
]

function createPricing(grossTotal: number, discountAmount = 0): Pricing {
  const grossPaise = Math.max(0, Math.round(grossTotal * 100))
  const discountPaise = Math.min(Math.max(0, Math.round(discountAmount * 100)), grossPaise)
  const totalPaise = grossPaise - discountPaise
  const subtotalPaise = Math.round(totalPaise / (1 + GST_RATE))

  return {
    grossTotal: grossPaise / 100,
    discountAmount: discountPaise / 100,
    subtotal: subtotalPaise / 100,
    gstAmount: (totalPaise - subtotalPaise) / 100,
    total: totalPaise / 100,
  }
}

function readServerPricing(value: unknown): Pricing | null {
  if (!value || typeof value !== "object") return null
  const candidate = value as Partial<Record<keyof Pricing | "currency", unknown>>
  if (candidate.currency !== "INR") return null

  const grossTotal = Number(candidate.grossTotal)
  const discountAmount = Number(candidate.discountAmount)
  const total = Number(candidate.total)
  if (![grossTotal, discountAmount, total].every(Number.isFinite)) return null

  const pricing = createPricing(grossTotal, discountAmount)
  return Math.round(pricing.total * 100) === Math.round(total * 100) ? pricing : null
}

function validateForm(form: ShippingForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = "Name is required"
  if (!form.email.trim()) errors.email = "Email is required"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email"
  if (!form.phone.trim()) errors.phone = "Phone is required"
  else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ""))) {
    errors.phone = "Enter 10-digit mobile number"
  }
  if (!form.address.trim()) errors.address = "Address is required"
  if (!form.city.trim()) errors.city = "City is required"
  if (!form.pincode.trim()) errors.pincode = "Pincode is required"
  else if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = "Enter valid 6-digit pincode"
  if (!form.state) errors.state = "State is required"
  if (form.gstNumber && !GSTIN_REGEX.test(form.gstNumber)) errors.gstNumber = "Enter a valid GSTIN"
  return errors
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

export function ShopClient({ razorpayKey }: { razorpayKey?: string }) {
  const router = useRouter()
  const buyRef = useRef<HTMLElement>(null)
  const viewContentFired = useRef(false)
  const addToCartSignature = useRef<string | null>(null)

  const [selected, setSelected] = useState<Pack>(() => PACKS.find((pack) => pack.id === "pack12") || PACKS[0])
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [cartHydrated, setCartHydrated] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [serverPricing, setServerPricing] = useState<Pricing | null>(null)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoInput, setPromoInput] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const pricing = useMemo(
    () => serverPricing || createPricing(selected.price, appliedPromo?.discountAmount || 0),
    [appliedPromo?.discountAmount, selected.price, serverPricing],
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem("unholy_cart")
      if (saved) {
        const data = JSON.parse(saved)
        const savedPack = PACKS.find((pack) => pack.id === data?.packId)
        if (savedPack) setSelected(savedPack)
        if (data?.shipping) setForm((prev) => ({ ...prev, ...data.shipping }))
      }
    } catch {
      /* Ignore stale cart data. */
    } finally {
      setCartHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!cartHydrated) return
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem("unholy_cart", JSON.stringify({ packId: selected.id, shipping: form }))
      } catch {
        /* Storage can fail in private browsing. Checkout should still work. */
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [cartHydrated, form, selected.id])

  useEffect(() => {
    if (!cartHydrated || viewContentFired.current) return
    viewContentFired.current = true
    trackPixel(
      "ViewContent",
      {
        value: selected.price,
        currency: "INR",
        content_ids: [selected.id],
        content_name: selected.title,
        content_type: "product",
        num_items: selected.qty,
        contents: [{ id: selected.id, quantity: 1, item_price: selected.price }],
      },
      generateEventId(),
    )
  }, [cartHydrated, selected])

  useEffect(() => {
    if (touched.size === 0) return
    const allErrors = validateForm(form)
    const visibleErrors: FormErrors = {}
    touched.forEach((field) => {
      const key = field as keyof ShippingForm
      if (allErrors[key]) visibleErrors[key] = allErrors[key]
    })
    setErrors(visibleErrors)
  }, [form, touched])

  const scrollToBuy = useCallback(() => {
    buyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const selectPack = useCallback(
    (pack: Pack) => {
      if (pack.id === selected.id) return
      setSelected(pack)
      setAppliedPromo(null)
      setServerPricing(null)
      setPayError(null)
      addToCartSignature.current = null
      trackPixel(
        "ViewContent",
        {
          value: pack.price,
          currency: "INR",
          content_ids: [pack.id],
          content_name: pack.title,
          content_type: "product",
          num_items: pack.qty,
          contents: [{ id: pack.id, quantity: 1, item_price: pack.price }],
        },
        generateEventId(),
      )
    },
    [selected.id],
  )

  const updateField = useCallback((field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setPayError(null)
  }, [])

  const blurField = useCallback((field: keyof ShippingForm) => {
    setTouched((prev) => new Set(prev).add(field))
  }, [])

  const applyPromo = useCallback(async () => {
    const code = promoInput.trim().toUpperCase()
    if (!code || promoLoading) return
    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderTotal: selected.price }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setPromoError(data?.error || "Invalid promo code.")
        return
      }
      setAppliedPromo({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
        promoRecordId: data.promoRecordId,
      })
      setServerPricing(null)
      setPromoInput("")
      addToCartSignature.current = null
    } catch {
      setPromoError("Unable to validate code right now.")
    } finally {
      setPromoLoading(false)
    }
  }, [promoInput, promoLoading, selected.price])

  const removePromo = useCallback(() => {
    setAppliedPromo(null)
    setServerPricing(null)
    setPromoError(null)
    addToCartSignature.current = null
  }, [])

  const pay = useCallback(async () => {
    if (submitting) return

    const allErrors = validateForm(form)
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setTouched(new Set(Object.keys(form)))
      setPayError("A few mortal details are missing.")
      const firstField = Object.keys(allErrors)[0]
      requestAnimationFrame(() => {
        const input = document.getElementById(`shop-${firstField}`)
        input?.scrollIntoView({ behavior: "smooth", block: "center" })
        input?.focus({ preventScroll: true })
      })
      return
    }

    if (!razorpayKey || typeof window === "undefined" || !window.Razorpay) {
      setPayError("Payment gateway is not configured.")
      return
    }

    setSubmitting(true)
    setPayError(null)

    const signature = `${selected.id}:${pricing.total}`
    if (addToCartSignature.current !== signature) {
      addToCartSignature.current = signature
      trackPixel(
        "AddToCart",
        {
          value: pricing.total,
          currency: "INR",
          content_ids: [selected.id],
          content_name: selected.title,
          content_type: "product",
          num_items: selected.qty,
          contents: [{ id: selected.id, quantity: 1, item_price: pricing.total }],
        },
        generateEventId(),
      )
    }

    trackPixel(
      "InitiateCheckout",
      {
        value: pricing.total,
        currency: "INR",
        content_ids: [selected.id],
        content_name: selected.title,
        content_type: "product",
        num_items: selected.qty,
        contents: [{ id: selected.id, quantity: 1, item_price: pricing.total }],
      },
      generateEventId(),
    )

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: selected.id,
          shipping: form,
          promoCode: appliedPromo?.code || undefined,
          promoRecordId: appliedPromo?.promoRecordId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to start checkout right now.")
      }

      const officialPricing = readServerPricing(data.order?.pricing)
      if (officialPricing) setServerPricing(officialPricing)

      const checkout = new window.Razorpay({
        key: razorpayKey,
        order_id: data.order.id,
        name: "UNHOLY CO.",
        description: `${selected.title} - ${selected.qty} cans of BloodThirst`,
        image: "/favicon.svg",
        theme: { color: "#B00020" },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch("/api/order/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: data.order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                sessionToken: data.sessionToken,
              }),
            })
            const verification = await verifyResponse.json()
            if (!verifyResponse.ok || !verification?.ok) {
              throw new Error(
                verifyResponse.status === 409
                  ? "This payment has already been confirmed."
                  : "Payment succeeded, but verification needs help. Contact rituals@theunholy.co",
              )
            }
            try {
              localStorage.removeItem("unholy_cart")
            } catch {
              /* Ignore storage failures after payment. */
            }
            router.push(`/thanks?receipt=${encodeURIComponent(verification.receiptToken)}`)
          } catch (error: any) {
            setSubmitting(false)
            setPayError(error?.message || "Payment verification failed.")
          }
        },
      })

      checkout.on("payment.failed", (response: any) => {
        setSubmitting(false)
        setPayError(response?.error?.description || "Payment was declined. Try a different method.")
      })

      checkout.open()
    } catch (error: any) {
      setSubmitting(false)
      setPayError(error?.message || "Payment failed to initialize.")
    }
  }, [appliedPromo, form, pricing.total, razorpayKey, router, selected, submitting])

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="min-h-screen bg-[#050505] text-offwhite">
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-80"
          aria-hidden
          style={{
            background:
              "radial-gradient(900px 520px at 72% 12%, rgba(176,0,32,0.22), transparent 62%), radial-gradient(680px 460px at 12% 40%, rgba(198,161,91,0.11), transparent 62%), linear-gradient(180deg, #090909 0%, #050505 48%, #000 100%)",
          }}
        />
        <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]" aria-hidden>
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <ShopHeader selected={selected} total={pricing.total} onBuy={scrollToBuy} />

        <main className="relative z-10">
          <Hero selected={selected} onBuy={scrollToBuy} />

          <BuySection
            refNode={buyRef}
            selected={selected}
            pricing={pricing}
            appliedPromo={appliedPromo}
            promoOpen={promoOpen}
            promoInput={promoInput}
            promoLoading={promoLoading}
            promoError={promoError}
            form={form}
            errors={errors}
            submitting={submitting}
            payError={payError}
            onSelect={selectPack}
            onPromoOpen={() => setPromoOpen(true)}
            onPromoInput={setPromoInput}
            onApplyPromo={applyPromo}
            onRemovePromo={removePromo}
            onChange={updateField}
            onBlur={blurField}
            onPay={pay}
          />

          <WhyItWorks onBuy={scrollToBuy} />
          <ProofStrip />
          <FaqSection onBuy={scrollToBuy} />
          <FinalCta selected={selected} onBuy={scrollToBuy} />
        </main>

        <MobileBuyBar selected={selected} total={pricing.total} onBuy={scrollToBuy} />
      </div>
    </>
  )
}

function ShopHeader({
  selected,
  total,
  onBuy,
}: {
  selected: Pack
  total: number
  onBuy: () => void
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/78 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-18 md:px-8">
        <Link href="/" className="font-cinzel text-sm font-black uppercase tracking-[0.34em] text-offwhite">
          Unholy <span className="text-blood">Co</span>
        </Link>
        <div className="hidden items-center gap-6 font-mono text-[10px] uppercase tracking-[0.28em] text-bone/55 md:flex">
          <span>BloodThirst</span>
          <span>{selected.qty} cans</span>
          <span>{money(total)}</span>
        </div>
        <button
          type="button"
          onClick={onBuy}
          className="border border-blood/60 bg-blood px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-white transition hover:border-blood hover:bg-[#c20a2b] active:scale-[0.98]"
        >
          Buy now
        </button>
      </div>
    </header>
  )
}

function Hero({ selected, onBuy }: { selected: Pack; onBuy: () => void }) {
  return (
    <section className="relative min-h-[92svh] overflow-hidden px-4 pb-12 pt-24 md:px-8 md:pb-16 md:pt-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.65fr)] lg:items-center">
        <div className="max-w-3xl">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.45em] text-[#C6A15B]">
            Canned still water for the beautifully dehydrated
          </p>
          <h1 className="font-cinzel text-5xl font-black uppercase leading-[0.82] tracking-0 text-offwhite sm:text-6xl md:text-8xl lg:text-9xl">
            Blood
            <span className="block text-blood">Thirst</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-bone/75 md:text-xl md:leading-8">
            500ml still natural mineral water in a matte-black aluminium can. Anti-plastic, anti-boring, premium hydration with a pulse.
          </p>

          <div className="mt-7 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
            {HERO_FACTS.map((fact) => (
              <div
                key={fact}
                className="border border-white/10 bg-white/[0.035] px-3 py-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-bone/70"
              >
                {fact}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onBuy}
              className="inline-flex min-h-14 items-center justify-center border border-blood bg-blood px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.28em] text-white shadow-[0_24px_80px_rgba(176,0,32,0.34)] transition hover:bg-[#c20a2b] active:scale-[0.99]"
            >
              Claim {selected.qty} cans
            </button>
            <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.22em] text-bone/50">
              From {money(selected.perCan)}/can. Free shipping. Checkout in one block.
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[24rem] lg:max-w-none">
          <div className="absolute left-1/2 top-[12%] h-[22rem] w-[22rem] -translate-x-1/2 bg-blood/25 blur-[90px]" aria-hidden />
          <div className="relative mx-auto flex aspect-[0.78] max-h-[38rem] items-center justify-center border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
            <div className="absolute inset-3 border border-white/8" aria-hidden />
            <Image
              src="/can.webp"
              alt="BloodThirst 500ml canned water"
              width={300}
              height={620}
              priority
              className="relative z-10 h-[82%] w-auto object-contain drop-shadow-[0_28px_80px_rgba(176,0,32,0.38)]"
            />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="font-cinzel text-2xl font-black uppercase text-offwhite">500ml</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-bone/45">Still water</p>
              </div>
              <div className="text-right">
                <p className="font-cinzel text-2xl font-black uppercase text-blood">{selected.qty}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-bone/45">Can pack</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BuySection({
  refNode,
  selected,
  pricing,
  appliedPromo,
  promoOpen,
  promoInput,
  promoLoading,
  promoError,
  form,
  errors,
  submitting,
  payError,
  onSelect,
  onPromoOpen,
  onPromoInput,
  onApplyPromo,
  onRemovePromo,
  onChange,
  onBlur,
  onPay,
}: {
  refNode: React.RefObject<HTMLElement | null>
  selected: Pack
  pricing: Pricing
  appliedPromo: AppliedPromo | null
  promoOpen: boolean
  promoInput: string
  promoLoading: boolean
  promoError: string | null
  form: ShippingForm
  errors: FormErrors
  submitting: boolean
  payError: string | null
  onSelect: (pack: Pack) => void
  onPromoOpen: () => void
  onPromoInput: (value: string) => void
  onApplyPromo: () => void
  onRemovePromo: () => void
  onChange: (field: keyof ShippingForm, value: string) => void
  onBlur: (field: keyof ShippingForm) => void
  onPay: () => void
}) {
  return (
    <section ref={refNode} id="buy" className="scroll-mt-20 px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.75fr_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-white/10 bg-[#0b0b0b] p-5 md:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-[#C6A15B]">
              The purchase altar
            </p>
            <h2 className="mt-3 font-cinzel text-3xl font-black uppercase leading-none text-offwhite md:text-5xl">
              Buy the water before it starts judging you.
            </h2>
            <p className="mt-5 text-sm leading-6 text-bone/65 md:text-base">
              Pick a pack. Add shipping. Pay securely. No cart maze, no corporate wellness sermon.
            </p>
            <div className="mt-6 space-y-3">
              {TRUST_MARKERS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 border border-white/8 bg-white/[0.025] px-3 py-3">
                  <Icon className="h-4 w-4 text-blood" aria-hidden />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone/65">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="border border-white/12 bg-[#080808] shadow-[0_30px_120px_rgba(0,0,0,0.5)]">
          <div className="border-b border-white/10 px-4 py-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/45">Step 01</p>
                <h3 className="mt-1 font-cinzel text-xl font-black uppercase text-offwhite">Choose your pack</h3>
              </div>
              <p className="border border-blood/35 bg-blood/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-blood">
                Free shipping
              </p>
            </div>
          </div>

          <div className="space-y-8 p-4 md:p-6">
            <PackSelector selected={selected} onSelect={onSelect} />

            <div className="grid gap-8 xl:grid-cols-[1fr_0.72fr]">
              <ShippingFormBlock form={form} errors={errors} onChange={onChange} onBlur={onBlur} />

              <div className="space-y-4">
                <OrderSummary
                  selected={selected}
                  pricing={pricing}
                  appliedPromo={appliedPromo}
                  promoOpen={promoOpen}
                  promoInput={promoInput}
                  promoLoading={promoLoading}
                  promoError={promoError}
                  onPromoOpen={onPromoOpen}
                  onPromoInput={onPromoInput}
                  onApplyPromo={onApplyPromo}
                  onRemovePromo={onRemovePromo}
                />

                <button
                  type="button"
                  onClick={onPay}
                  disabled={submitting}
                  className="flex min-h-14 w-full items-center justify-center gap-3 border border-blood bg-blood px-5 py-4 font-mono text-[11px] font-black uppercase tracking-[0.24em] text-white transition hover:bg-[#c20a2b] disabled:cursor-wait disabled:opacity-65"
                >
                  <Lock className="h-4 w-4" aria-hidden />
                  {submitting ? "Opening checkout" : `Pay ${money(pricing.total)} securely`}
                </button>
                <p className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.22em] text-bone/45">
                  Razorpay handles cards, UPI, wallets, and netbanking.
                </p>
                {payError && (
                  <div className="border border-blood/40 bg-blood/10 px-4 py-3 text-center" role="alert">
                    <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-blood">
                      {payError}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PackSelector({ selected, onSelect }: { selected: Pack; onSelect: (pack: Pack) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {PACKS.map((pack) => {
        const active = pack.id === selected.id
        const starter = PACKS[0]?.perCan || pack.perCan
        const savings = Math.max(0, (starter - pack.perCan) * pack.qty)
        return (
          <button
            key={pack.id}
            type="button"
            onClick={() => onSelect(pack)}
            className={`relative min-h-36 border p-4 text-left transition md:min-h-48 ${
              active
                ? "border-blood bg-blood text-white shadow-[0_22px_70px_rgba(176,0,32,0.25)]"
                : "border-white/10 bg-white/[0.025] text-bone hover:border-white/25 hover:bg-white/[0.045]"
            }`}
            aria-pressed={active}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] opacity-70">
                {pack.tag || "BloodThirst"}
              </span>
              <span className={`flex h-5 w-5 items-center justify-center border ${active ? "border-white" : "border-white/25"}`}>
                {active && <Check className="h-3.5 w-3.5" aria-hidden />}
              </span>
            </div>
            <p className="mt-6 font-cinzel text-4xl font-black uppercase leading-none">
              {pack.qty}
              <span className="ml-1 align-top font-mono text-[10px] tracking-[0.24em]">cans</span>
            </p>
            <p className="mt-3 font-cinzel text-2xl font-black tabular-nums">{money(pack.price)}</p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.18em] opacity-70">
              <span>{money(pack.perCan)}/can</span>
              {savings > 0 && <span>Save {money(savings)}</span>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ShippingFormBlock({
  form,
  errors,
  onChange,
  onBlur,
}: {
  form: ShippingForm
  errors: FormErrors
  onChange: (field: keyof ShippingForm, value: string) => void
  onBlur: (field: keyof ShippingForm) => void
}) {
  return (
    <div>
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/45">Step 02</p>
        <h3 className="mt-1 font-cinzel text-xl font-black uppercase text-offwhite">Shipping details</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Name" field="name" value={form.name} error={errors.name} onChange={onChange} onBlur={onBlur} autoComplete="name" />
        <InputField label="Email" field="email" value={form.email} error={errors.email} onChange={onChange} onBlur={onBlur} type="email" autoComplete="email" />
        <InputField label="Phone" field="phone" value={form.phone} error={errors.phone} onChange={onChange} onBlur={onBlur} type="tel" autoComplete="tel" inputMode="numeric" />
        <InputField label="Pincode" field="pincode" value={form.pincode} error={errors.pincode} onChange={onChange} onBlur={onBlur} autoComplete="postal-code" inputMode="numeric" />
      </div>

      <div className="mt-3 space-y-3">
        <InputField label="Address" field="address" value={form.address} error={errors.address} onChange={onChange} onBlur={onBlur} autoComplete="street-address" />
        <div className="grid gap-3 sm:grid-cols-2">
          <InputField label="City" field="city" value={form.city} error={errors.city} onChange={onChange} onBlur={onBlur} autoComplete="address-level2" />
          <StateField value={form.state} error={errors.state} onChange={onChange} onBlur={onBlur} />
        </div>
        <InputField
          label="GSTIN optional"
          field="gstNumber"
          value={form.gstNumber || ""}
          error={errors.gstNumber}
          onChange={(field, value) => onChange(field, value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
          onBlur={onBlur}
          autoComplete="off"
        />
      </div>
    </div>
  )
}

function InputField({
  label,
  field,
  value,
  error,
  type = "text",
  autoComplete,
  inputMode,
  onChange,
  onBlur,
}: {
  label: string
  field: keyof ShippingForm
  value: string
  error?: string
  type?: string
  autoComplete?: string
  inputMode?: "numeric"
  onChange: (field: keyof ShippingForm, value: string) => void
  onBlur: (field: keyof ShippingForm) => void
}) {
  const id = `shop-${field}`
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.24em] text-bone/50">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(field, event.target.value)}
        onBlur={() => onBlur(field)}
        className={`w-full border bg-black/55 px-3.5 py-3 text-sm text-offwhite outline-none transition placeholder:text-bone/25 focus:border-blood ${
          error ? "border-blood" : "border-white/12"
        }`}
      />
      {error && <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-blood">{error}</p>}
    </div>
  )
}

function StateField({
  value,
  error,
  onChange,
  onBlur,
}: {
  value: string
  error?: string
  onChange: (field: keyof ShippingForm, value: string) => void
  onBlur: (field: keyof ShippingForm) => void
}) {
  return (
    <div>
      <label htmlFor="shop-state" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.24em] text-bone/50">
        State
      </label>
      <div className="relative">
        <select
          id="shop-state"
          value={value}
          onChange={(event) => onChange("state", event.target.value)}
          onBlur={() => onBlur("state")}
          className={`w-full appearance-none border bg-black/55 px-3.5 py-3 text-sm text-offwhite outline-none transition focus:border-blood ${
            error ? "border-blood" : "border-white/12"
          }`}
        >
          <option value="" disabled>
            Select state
          </option>
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state} className="text-black">
              {state}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/45" aria-hidden />
      </div>
      {error && <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-blood">{error}</p>}
    </div>
  )
}

function OrderSummary({
  selected,
  pricing,
  appliedPromo,
  promoOpen,
  promoInput,
  promoLoading,
  promoError,
  onPromoOpen,
  onPromoInput,
  onApplyPromo,
  onRemovePromo,
}: {
  selected: Pack
  pricing: Pricing
  appliedPromo: AppliedPromo | null
  promoOpen: boolean
  promoInput: string
  promoLoading: boolean
  promoError: string | null
  onPromoOpen: () => void
  onPromoInput: (value: string) => void
  onApplyPromo: () => void
  onRemovePromo: () => void
}) {
  return (
    <div className="border border-white/10 bg-white/[0.025] p-4">
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/45">Step 03</p>
        <h3 className="mt-1 font-cinzel text-xl font-black uppercase text-offwhite">Pay the thirst</h3>
      </div>

      <div className="space-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/65">
        <SummaryRow label={`${selected.title} (${selected.qty} cans)`} value={money(selected.price)} />
        {appliedPromo && <SummaryRow label={`Discount ${appliedPromo.code}`} value={`-${money(appliedPromo.discountAmount)}`} tone="good" />}
        <SummaryRow label="Shipping" value="Free" tone="good" />
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-end justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-bone/50">Total incl. GST</span>
          <span className="font-cinzel text-4xl font-black tabular-nums text-offwhite">{money(pricing.total)}</span>
        </div>
        <p className="mt-1 text-right font-mono text-[10px] text-bone/45">
          Includes {GST_RATE * 100}% GST: {money(pricing.gstAmount)}
        </p>
      </div>

      <div className="mt-5">
        {appliedPromo ? (
          <div className="flex items-center justify-between gap-3 border border-green-500/30 bg-green-500/10 px-3 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-green-300">{appliedPromo.code} applied</span>
            <button type="button" onClick={onRemovePromo} className="text-bone/60 transition hover:text-offwhite" aria-label="Remove promo code">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : promoOpen ? (
          <div>
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(event) => onPromoInput(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onApplyPromo()
                }}
                placeholder="CULT10"
                className="min-w-0 flex-1 border border-white/12 bg-black/55 px-3.5 py-3 font-mono text-sm uppercase tracking-[0.18em] text-offwhite outline-none focus:border-blood"
              />
              <button
                type="button"
                onClick={onApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                className="border border-white/15 px-4 font-mono text-[10px] uppercase tracking-[0.22em] text-bone transition hover:border-blood hover:text-offwhite disabled:opacity-45"
              >
                {promoLoading ? "..." : "Apply"}
              </button>
            </div>
            {promoError && <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-blood">{promoError}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={onPromoOpen}
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-bone/55 underline decoration-bone/30 underline-offset-4 transition hover:text-offwhite"
          >
            Have a promo code?
          </button>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: "good" }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0">{label}</span>
      <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-white/18" />
      <span className={`shrink-0 tabular-nums ${tone === "good" ? "text-green-300" : "text-offwhite/80"}`}>{value}</span>
    </div>
  )
}

function WhyItWorks({ onBuy }: { onBuy: () => void }) {
  return (
    <section className="px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-[#C6A15B]">Why it exists</p>
            <h2 className="mt-4 font-cinzel text-4xl font-black uppercase leading-[0.9] text-offwhite md:text-6xl">
              Because bottled water got spiritually lazy.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-bone/70 md:text-lg">
            BloodThirst is built for the split second where a visitor asks, is that water? Yes. That is the joke, the utility, and the conversion hook.
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {REASONS.map((reason, index) => (
            <div key={reason.title} className="border border-white/10 bg-white/[0.025] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-blood">0{index + 1}</p>
              <h3 className="mt-5 font-cinzel text-2xl font-black uppercase leading-tight text-offwhite">{reason.title}</h3>
              <p className="mt-4 text-sm leading-6 text-bone/65">{reason.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 border border-white/10 bg-[#080808] p-4 md:grid-cols-2 md:p-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/45">Unholy comparison chart</p>
            <h3 className="mt-3 font-cinzel text-3xl font-black uppercase text-offwhite">Plastic bottle versus BloodThirst</h3>
          </div>
          <div className="space-y-2">
            {COMPARISON.map(([label, plastic, blood]) => (
              <div key={label} className="grid grid-cols-[0.8fr_1fr_1fr] gap-2 border-b border-white/10 pb-2 text-xs leading-5 md:text-sm">
                <span className="font-mono uppercase tracking-[0.16em] text-bone/45">{label}</span>
                <span className="text-bone/45">{plastic}</span>
                <span className="font-medium text-offwhite">{blood}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={onBuy}
              className="mt-5 inline-flex min-h-12 items-center justify-center border border-white/15 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-bone transition hover:border-blood hover:text-offwhite"
            >
              Choose your pack
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProofStrip() {
  return (
    <section className="px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1fr]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-[#C6A15B]">Proof without the lab coat</p>
            <h2 className="mt-4 font-cinzel text-4xl font-black uppercase leading-[0.9] text-offwhite md:text-6xl">
              The fridge becomes a conversation hazard.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
            {REVIEWS.map((review) => (
              <figure key={review.quote} className="border border-white/10 bg-white/[0.025] p-5">
                <div className="mb-4 flex gap-1 text-[#C6A15B]" aria-label="Five star review">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} className="h-3.5 w-3.5 fill-current" aria-hidden />
                  ))}
                </div>
                <blockquote className="text-sm leading-6 text-bone/75">{review.quote}</blockquote>
                <figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-bone/45">{review.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection({ onBuy }: { onBuy: () => void }) {
  return (
    <section className="px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.6fr_1fr]">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-[#C6A15B]">Objection exorcism</p>
          <h2 className="mt-4 font-cinzel text-4xl font-black uppercase leading-[0.9] text-offwhite md:text-6xl">
            Questions before the pact.
          </h2>
          <button
            type="button"
            onClick={onBuy}
            className="mt-6 hidden border border-blood bg-blood px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-white transition hover:bg-[#c20a2b] lg:inline-flex"
          >
            Buy BloodThirst
          </button>
        </div>
        <div className="space-y-3">
          {FAQS.map((item) => (
            <details key={item.question} className="group border border-white/10 bg-white/[0.025] p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-cinzel text-xl font-black uppercase text-offwhite">
                {item.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-blood transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-4 text-sm leading-6 text-bone/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta({ selected, onBuy }: { selected: Pack; onBuy: () => void }) {
  return (
    <section className="px-4 pb-32 pt-12 md:px-8 md:pb-24">
      <div className="mx-auto grid max-w-7xl gap-8 border border-white/10 bg-[linear-gradient(135deg,rgba(176,0,32,0.18),rgba(255,255,255,0.025))] p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-[#C6A15B]">Last call</p>
          <h2 className="mt-4 font-cinzel text-4xl font-black uppercase leading-[0.9] text-offwhite md:text-6xl">
            Put the cult in your cart.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-bone/70">
            Start with {selected.qty} cans. Hydrate normally. Look suspiciously better doing it.
          </p>
        </div>
        <button
          type="button"
          onClick={onBuy}
          className="inline-flex min-h-14 items-center justify-center border border-blood bg-blood px-6 py-4 font-mono text-[11px] font-black uppercase tracking-[0.24em] text-white transition hover:bg-[#c20a2b]"
        >
          Buy {selected.qty} cans
        </button>
      </div>

      <footer className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone/35">
          Unholy Co. BloodThirst. Hydration, but possessed.
        </p>
        <nav className="flex flex-wrap justify-center gap-4 font-mono text-[9px] uppercase tracking-[0.24em] text-bone/45 md:justify-end" aria-label="Shop support">
          <Link href="/faq">FAQ</Link>
          <Link href="/track">Track order</Link>
          <Link href="/refund">Refunds</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </footer>
    </section>
  )
}

function MobileBuyBar({
  selected,
  total,
  onBuy,
}: {
  selected: Pack
  total: number
  onBuy: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-cinzel text-base font-black uppercase text-offwhite">{selected.qty} cans</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">{money(total)} incl. GST</p>
        </div>
        <button
          type="button"
          onClick={onBuy}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-blood bg-blood px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white"
        >
          <Droplets className="h-4 w-4" aria-hidden />
          Buy
        </button>
      </div>
    </div>
  )
}
