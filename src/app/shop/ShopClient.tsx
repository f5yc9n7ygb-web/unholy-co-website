"use client"

import Script from "next/script"
import Image from "next/image"
import { useState, useEffect } from "react"
import { motion, MotionConfig } from "framer-motion"
import { PACKS, type Pack, getGstAmount, getBasePrice } from "@/lib/shop/catalog"
import type { ShippingForm } from "@/lib/shop/types"
import { usePageTransition } from "@/context/TransitionContext"

type FormErrors = Partial<Record<keyof ShippingForm, string>>
type Step = "select" | "shipping" | "review"

/** Supplier is in UP — if buyer is also UP it's intra-state (CGST+SGST), else IGST */
const SUPPLIER_STATE = "Uttar Pradesh"
function isInterstate(buyerState: string): boolean {
  return !!buyerState && buyerState !== SUPPLIER_STATE
}

type AppliedPromo = {
  code: string
  discountType: "percentage" | "flat"
  discountValue: number
  discountAmount: number
  finalPrice: number
  promoRecordId: string
}

declare global {
  interface Window { Razorpay: any }
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
]

function validateForm(form: ShippingForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = "Name is required"
  if (!form.email.trim()) errors.email = "Email is required"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email"
  if (!form.phone.trim()) errors.phone = "Phone is required"
  else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ""))) errors.phone = "Enter 10-digit mobile number"
  if (!form.address.trim()) errors.address = "Address is required"
  if (!form.city.trim()) errors.city = "City is required"
  if (!form.pincode.trim()) errors.pincode = "Pincode is required"
  else if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = "Enter valid 6-digit pincode"
  if (!form.state) errors.state = "State is required"
  return errors
}

const STEPS: Step[] = ["select", "shipping", "review"]

/* ─── Main Component ─── */
export function ShopClient({ razorpayKey }: { razorpayKey?: string }) {
  const { navigate } = usePageTransition()
  const [step, setStep] = useState<Step>("select")
  const [selected, setSelected] = useState<Pack>(PACKS[0])
  const [loading, setLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [form, setForm] = useState<ShippingForm>({
    name: "", email: "", phone: "", address: "", city: "", pincode: "", state: "", gstNumber: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const key = razorpayKey

  // ── Persist cart selection & shipping in localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem("unholy_cart")
      if (saved) {
        const data = JSON.parse(saved)
        if (data.packId) {
          const pack = PACKS.find((p) => p.id === data.packId)
          if (pack) setSelected(pack)
        }
        if (data.shipping) {
          setForm((prev) => ({ ...prev, ...data.shipping }))
        }
      }
    } catch { /* ignore corrupt data */ }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("unholy_cart", JSON.stringify({
          packId: selected.id,
          shipping: form,
        }))
      } catch { /* storage full or unavailable */ }
    }, 300)
    return () => clearTimeout(timer)
  }, [selected, form])

  // Clear promo when pack changes (discount may no longer apply)
  useEffect(() => {
    setAppliedPromo(null)
  }, [selected.id])

  useEffect(() => {
    if (touched.size === 0) return
    const allErrors = validateForm(form)
    const visibleErrors: FormErrors = {}
    touched.forEach((field) => {
      const k = field as keyof ShippingForm
      if (allErrors[k]) visibleErrors[k] = allErrors[k]
    })
    setErrors(visibleErrors)
  }, [form, touched])

  const go = (target: Step) => {
    setStep(target)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const goToReview = () => {
    const allErrors = validateForm(form)
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setTouched(new Set(Object.keys(form)))
      return
    }
    go("review")
  }

  const onPay = async () => {
    if (loading) return
    if (!key || !window.Razorpay) {
      setPayError("Payment gateway is not configured.")
      return
    }
    setLoading(true)
    setPayError(null)
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
      if (!res.ok || !data?.ok) throw new Error("Unable to start checkout right now.")

      const rz = new window.Razorpay({
        key,
        order_id: data.order.id,
        name: "UNHOLY CO.",
        description: `${selected.title} — ${selected.qty} cans`,
        image: "/favicon.svg",
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
            if (!verifyResponse.ok || !verification.ok) {
              throw new Error(
                verifyResponse.status === 409
                  ? "This payment has already been confirmed."
                  : "We could not verify your payment immediately. Please contact rituals@theunholy.co"
              )
            }
            try { localStorage.removeItem("unholy_cart") } catch {}
            navigate(
              `/thanks?receipt=${encodeURIComponent(verification.receiptToken)}`
            )
          } catch (error: any) {
            setPayError(error?.message || "Payment verification failed.")
            setLoading(false)
          }
        },
        theme: { color: "#B00020" },
        modal: { ondismiss: () => setLoading(false) },
      })
      rz.on("payment.failed", (resp: any) => {
        const reason = resp?.error?.description || "Payment was declined. Please try again or use a different payment method."
        setPayError(reason)
        setLoading(false)
      })
      rz.open()
    } catch (e: any) {
      setPayError(e?.message || "Payment failed to initialize.")
      setLoading(false)
    }
  }

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const blurField = (field: keyof ShippingForm) => {
    setTouched((prev) => new Set(prev).add(field))
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <MotionConfig reducedMotion="user">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* Atmospheric background — fixed blood glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-15%] top-[5%] h-[700px] w-[700px] rounded-full bg-blood/10 blur-[180px]"
        />
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute right-[-10%] bottom-[10%] h-[500px] w-[500px] rounded-full bg-blood/8 blur-[140px]"
        />
      </div>

      {/* Page */}
      <div className="relative z-10 min-h-screen pb-32 pt-28 md:pt-36">

        {/* Step Indicator */}
        <div className="container max-w-5xl mb-12 md:mb-16">
          <StepIndicator step={step} stepIndex={stepIndex} go={go} />
        </div>

        {/* Step Content */}
        <div key={step} className="animate-step-in">
            {step === "select" && (
              <SelectStep
                packs={PACKS}
                selected={selected}
                onSelect={setSelected}
                onContinue={() => go("shipping")}
              />
            )}
            {step === "shipping" && (
              <ShippingStep
                selected={selected}
                form={form}
                errors={errors}
                onChange={updateField}
                onBlur={blurField}
                onBack={() => go("select")}
                onNext={goToReview}
              />
            )}
            {step === "review" && (
              <ReviewStep
                selected={selected}
                form={form}
                loading={loading}
                payError={payError}
                appliedPromo={appliedPromo}
                onApplyPromo={setAppliedPromo}
                onRemovePromo={() => setAppliedPromo(null)}
                onBack={() => go("shipping")}
                onChangeProduct={() => go("select")}
                onUpgradeProduct={(pack) => { setSelected(pack); setAppliedPromo(null); }}
                onChangeShipping={() => go("shipping")}
                onPay={onPay}
              />
            )}
        </div>
      </div>
    </MotionConfig>
  )
}

/* ─── Step Indicator ─── */
function StepIndicator({ step, stepIndex, go }: {
  step: Step
  stepIndex: number
  go: (s: Step) => void
}) {
  const LABELS: Record<Step, string> = {
    select: "Choose Ritual",
    shipping: "Shipping",
    review: "Review & Pay",
  }

  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const isActive = s === step
        const isComplete = i < stepIndex
        return (
          <div key={s} className="flex items-center">
            <button
              onClick={() => isComplete ? go(s) : undefined}
              disabled={!isComplete && !isActive}
              className="flex flex-col items-center gap-2 transition-all"
              style={{ cursor: isComplete ? "pointer" : "default" }}
            >
              <div className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-500 ${
                isActive
                  ? "border-blood bg-blood text-white shadow-[0_0_28px_rgba(176,0,32,0.7)]"
                  : isComplete
                    ? "border-blood/40 bg-blood/15 text-blood"
                    : "border-ash/30 bg-ash/10 text-bone/20"
              }`}>
                {isComplete ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  <span className="font-cinzel text-xs font-bold">{i + 1}</span>
                )}
              </div>
              <span className={`text-[9px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                isActive ? "text-offwhite" : isComplete ? "text-blood/60" : "text-bone/20"
              }`}>
                {LABELS[s]}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="mx-4 mb-6 flex items-center">
                <div className={`h-px w-10 md:w-16 transition-all duration-700 ${
                  i < stepIndex ? "bg-blood/50" : "bg-ash/25"
                }`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Step 1: Select Pack ─── */
function SelectStep({ packs, selected, onSelect, onContinue }: {
  packs: Pack[]
  selected: Pack
  onSelect: (p: Pack) => void
  onContinue: () => void
}) {
  return (
    <div className="container max-w-6xl">
      {/* Header */}
      <div className="mb-14 grid gap-8 md:grid-cols-[1fr,auto] md:items-end">
        <div>
          <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/70">
            BLOODTHIRST — Sacred Packs
          </p>
          <h1 className="font-cinzel text-4xl font-black uppercase leading-[0.9] tracking-[-0.01em] text-offwhite md:text-6xl lg:text-7xl">
            Choose Your<br />
            <span className="text-blood">Ritual</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm text-bone/50 md:text-base">
            Himalayan mineral water. Zero sugar. Zero plastic. One very black can. Free shipping across India.
          </p>
        </div>

        {/* Floating can visualization */}
        <div className="relative hidden md:flex h-44 w-36 items-end justify-center">
          <div className="absolute bottom-0 left-1/2 h-10 w-32 -translate-x-1/2 rounded-full bg-blood/30 blur-2xl" />
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/can.webp"
              alt="BloodThirst"
              width={120}
              height={210}
              className="relative z-10 drop-shadow-[0_0_60px_rgba(176,0,32,0.4)]"
            />
          </motion.div>
        </div>
      </div>

      {/* Pack Grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {packs.map((pack, i) => {
          const isActive = selected.id === pack.id
          const num = `0${i + 1}`
          const isFeatured = !!pack.tag
          const showLimitedBatch = pack.id === "pack6" || isFeatured

          return (
            <motion.button
              key={pack.id}
              onClick={() => onSelect(pack)}
              whileHover={{ y: isActive ? 0 : -4 }}
              className={`group relative flex min-h-[200px] md:min-h-[420px] flex-col overflow-hidden rounded-2xl border p-7 text-left transition-all duration-500 ${
                isActive
                  ? "border-blood/65 bg-black/50 shadow-[0_0_70px_rgba(176,0,32,0.22),inset_0_0_80px_rgba(176,0,32,0.06)]"
                  : "border-white/[0.07] bg-black/30 hover:border-white/[0.15] hover:bg-black/40"
              }`}
            >
              {/* Top accent line for featured packs */}
              {isFeatured && (
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blood to-transparent" />
              )}

              {/* Big decorative number */}
              <span
                className={`absolute bottom-4 right-5 select-none font-cinzel font-black leading-none transition-all duration-500 ${
                  isActive ? "text-blood/[0.07] text-[8rem]" : "text-white/[0.04] text-[8rem]"
                }`}
                aria-hidden="true"
              >
                {num}
              </span>

              {/* Ambient glow for active card */}
              {isActive && (
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(176,0,32,0.12),transparent_60%)]" />
              )}

              <div className="relative z-10 flex h-full flex-col">
                {/* Badge */}
                <div className="mb-6">
                  {pack.tag ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blood/40 bg-blood/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blood">
                      <span className="h-1 w-1 rounded-full bg-blood animate-pulse-slow" />
                      {pack.tag}
                    </span>
                  ) : (
                    <span className="inline-block rounded-full border border-white/[0.08] px-3 py-1 text-[10px] uppercase tracking-wider text-bone/25">
                      Pack {num}
                    </span>
                  )}
                </div>

                {/* Pack title */}
                <h3 className={`font-cinzel text-2xl font-bold uppercase leading-tight tracking-wide transition-colors duration-300 ${
                  isActive ? "text-offwhite" : "text-offwhite/75 group-hover:text-offwhite"
                }`}>
                  {pack.title}
                </h3>

                {/* Qty & Scarcity */}
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-bone/35">
                    {pack.qty} × BloodThirst 500ml
                  </p>
                  {showLimitedBatch && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-blood/80 animate-pulse-slow">
                      <span className="h-1 w-1 rounded-full bg-blood" />
                      Limited Batch Remaining
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className={`my-5 h-px transition-colors duration-500 ${isActive ? "bg-blood/20" : "bg-white/[0.05]"}`} />

                {/* Blurb */}
                <p className="text-sm leading-relaxed text-bone/45">
                  {pack.blurb}
                </p>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Price */}
                <div className="mt-6">
                  <div className="flex items-end gap-2">
                    <span className={`font-cinzel text-4xl font-black transition-colors duration-300 ${
                      isActive ? "text-offwhite" : "text-offwhite/80"
                    }`}>
                      ₹{pack.price.toLocaleString("en-IN")}
                    </span>
                    <span className="mb-1.5 text-xs text-bone/35">
                      ₹{pack.perCan}/can
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-bone/30">Incl. taxes · Free shipping</p>
                </div>

                {/* Subscribe & Save is intentionally hidden until subscriptions launch. */}

                {/* Select indicator */}
                <div className={`mt-5 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] transition-all duration-300 ${
                  isActive ? "text-blood" : "text-bone/25 group-hover:text-bone/50"
                }`}>
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive ? "border-blood bg-blood shadow-[0_0_12px_rgba(176,0,32,0.6)]" : "border-bone/25"
                  }`}>
                    {isActive && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </div>
                  {isActive ? "Selected" : "Select Pack"}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Bottom Action Bar */}
      <div
        className="mt-6 flex flex-col gap-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/50 px-6 py-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
        style={{
          boxShadow: "0 0 50px rgba(176,0,32,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-10 shrink-0">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/can.webp"
                alt="BloodThirst"
                width={40}
                height={70}
                className="drop-shadow-[0_4px_16px_rgba(176,0,32,0.35)]"
              />
            </motion.div>
          </div>
          <div>
            <p className="font-cinzel font-semibold text-offwhite">{selected.title}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-bone/35">
              {selected.qty} cans · Free delivery · All India
            </p>
          </div>
        </div>
        <div className="flex w-full items-center gap-5 sm:w-auto sm:shrink-0">
          <div className="text-right">
            <p className="font-cinzel text-2xl font-bold text-offwhite">
              ₹{selected.price.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-bone/35">Incl. all taxes</p>
          </div>
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary flex-1 px-8 py-3.5 text-sm sm:flex-none"
          >
            Proceed →
          </motion.button>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 2: Shipping ─── */
function ShippingStep({ selected, form, errors, onChange, onBlur, onBack, onNext }: {
  selected: Pack
  form: ShippingForm
  errors: FormErrors
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="container max-w-5xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/70">
          STEP 02 — SHIPPING
        </p>
        <h2 className="font-cinzel text-3xl font-black uppercase leading-tight text-offwhite md:text-5xl">
          Delivery Details
        </h2>
        <p className="mt-3 text-sm text-bone/45">
          Where should we send your ritual supply?
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.35fr,0.65fr]">
        {/* Form */}
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <LuxField label="Full Name" field="name" value={form.name} error={errors.name}
              placeholder="John Doe" onChange={onChange} onBlur={onBlur} />
            <LuxField label="Email Address" field="email" value={form.email} error={errors.email}
              placeholder="you@domain.com" type="email" onChange={onChange} onBlur={onBlur} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <LuxField label="Phone Number" field="phone" value={form.phone} error={errors.phone}
              placeholder="9876543210" type="tel" onChange={onChange} onBlur={onBlur} />
            <LuxField label="Pincode" field="pincode" value={form.pincode} error={errors.pincode}
              placeholder="110001" onChange={onChange} onBlur={onBlur} />
          </div>
          <LuxField label="Street Address" field="address" value={form.address} error={errors.address}
            placeholder="House no., Street, Locality" onChange={onChange} onBlur={onBlur} />
          <div className="grid gap-4 sm:grid-cols-2">
            <LuxField label="City" field="city" value={form.city} error={errors.city}
              placeholder="Mumbai" onChange={onChange} onBlur={onBlur} />
            <div>
              <label htmlFor="field-state" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-bone/45">State</label>
              <div className="relative">
                <select
                  id="field-state"
                  value={form.state}
                  onChange={(e) => onChange("state", e.target.value)}
                  onBlur={() => onBlur("state")}
                  className={`w-full appearance-none rounded-xl border bg-black/50 px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-blood/60 focus:ring-1 focus:ring-blood/20 ${
                    errors.state ? "border-blood/60" : "border-white/[0.08]"
                  } ${form.state ? "text-offwhite" : "text-bone/20"}`}
                >
                  <option value="" disabled>Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s} className="text-black">{s}</option>)}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-bone/30">
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </div>
              </div>
              {errors.state && (
                <p className="mt-1.5 text-xs text-blood" role="alert">{errors.state}</p>
              )}
            </div>
          </div>

          {/* GST number — optional, for business buyers */}
          <GstLookupField
            value={form.gstNumber ?? ""}
            businessName={form.gstBusinessName ?? ""}
            onChange={onChange}
            onBlur={onBlur}
          />

          <div className="flex gap-3 pt-3">
            <button onClick={onBack} className="btn btn-ghost px-5 text-sm">← Back</button>
            <motion.button
              onClick={onNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary flex-1 py-3.5 text-sm"
            >
              Review Order →
            </motion.button>
          </div>
        </div>

        {/* Sidebar summary */}
        <div className="h-fit lg:sticky lg:top-28">
          <div
            className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/50 backdrop-blur-xl"
            style={{ boxShadow: "0 0 60px rgba(176,0,32,0.07), inset 0 1px 0 rgba(255,255,255,0.04)" }}
          >
            {/* Can hero */}
            <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-b from-blood/10 to-transparent">
              <div className="absolute bottom-0 left-1/2 h-10 w-32 -translate-x-1/2 rounded-full bg-blood/20 blur-2xl" />
              <Image
                src="/can.webp"
                alt="BloodThirst"
                width={70}
                height={122}
                className="relative z-10 drop-shadow-[0_8px_24px_rgba(176,0,32,0.4)]"
              />
            </div>

            <div className="p-5">
              <div className="pb-4 border-b border-white/[0.06]">
                <p className="font-cinzel font-semibold text-offwhite">{selected.title}</p>
                <p className="mt-1 text-xs text-bone/40">{selected.qty} × BloodThirst 500ml</p>
                {selected.tag && (
                  <span className="mt-2 inline-block text-[10px] uppercase tracking-wider text-blood/80">{selected.tag}</span>
                )}
              </div>

              <div className="py-4 space-y-2.5 text-sm border-b border-white/[0.06]">
                <div className="flex justify-between text-bone/55">
                  <span>Subtotal</span>
                  <span className="text-offwhite">₹{getBasePrice(selected.price).toLocaleString("en-IN")}</span>
                </div>
                <GstRows amount={selected.price} buyerState={form.state} />
                <div className="flex justify-between text-bone/55">
                  <span>Shipping</span>
                  <span className="text-xs font-medium text-green-400">FREE</span>
                </div>
              </div>

              <div className="flex justify-between pt-4 font-bold text-offwhite">
                <span className="font-cinzel">Total</span>
                <span className="font-cinzel text-lg">₹{selected.price.toLocaleString("en-IN")}</span>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[11px] text-bone/35">
                <LockIcon />
                Secured by Razorpay · 256-bit SSL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 3: Review & Pay ─── */
function ReviewStep({ selected, form, loading, payError, appliedPromo, onApplyPromo, onRemovePromo, onBack, onChangeProduct, onUpgradeProduct, onChangeShipping, onPay }: {
  selected: Pack
  form: ShippingForm
  loading: boolean
  payError: string | null
  appliedPromo: AppliedPromo | null
  onApplyPromo: (promo: AppliedPromo) => void
  onRemovePromo: () => void
  onBack: () => void
  onChangeProduct: () => void
  onUpgradeProduct: (pack: Pack) => void
  onChangeShipping: () => void
  onPay: () => void
}) {
  const [promoInput, setPromoInput] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  const nextPack = selected.id === "pack6" 
    ? PACKS.find((p) => p.id === "pack12") 
    : selected.id === "pack12" 
      ? PACKS.find((p) => p.id === "pack24") 
      : null;

  const applyPromo = async () => {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), orderTotal: selected.price }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setPromoError(data?.error || "Invalid promo code.")
        return
      }
      onApplyPromo({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
        promoRecordId: data.promoRecordId,
      })
      setPromoInput("")
    } catch {
      setPromoError("Unable to validate code right now.")
    } finally {
      setPromoLoading(false)
    }
  }

  const effectiveTotal = appliedPromo ? appliedPromo.finalPrice : selected.price
  return (
    <div className="container max-w-5xl">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/70">
          STEP 03 — REVIEW
        </p>
        <h2 className="font-cinzel text-3xl font-black uppercase leading-tight text-offwhite md:text-5xl">
          Review &<br className="sm:hidden" />
          <span className="text-blood"> Complete</span>
        </h2>
        <p className="mt-3 text-sm text-bone/45">
          Everything look good? Complete your ritual below.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        {/* Left: Product + Shipping */}
        <div className="space-y-4">
          {/* Product card */}
          <div
            className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/50 backdrop-blur-xl"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-bone/40">Product</p>
              <button onClick={onChangeProduct} className="text-xs text-blood transition-colors hover:text-blood/70">
                Change
              </button>
            </div>
            <div className="flex items-center gap-5 p-5">
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-black/50 p-2">
                <div className="absolute inset-0 bg-gradient-to-b from-blood/15 to-transparent" />
                <Image src="/can.webp" alt="BloodThirst" fill className="object-contain drop-shadow-[0_4px_16px_rgba(176,0,32,0.3)]" />
              </div>
              <div>
                <p className="font-cinzel text-lg font-bold text-offwhite">{selected.title}</p>
                <p className="mt-0.5 text-sm text-bone/45">{selected.qty} × BloodThirst 500ml</p>
                <p className="text-xs text-bone/35">₹{selected.perCan.toFixed(0)} per can</p>
                <p className="mt-2 font-cinzel text-2xl font-black text-offwhite">
                  ₹{selected.price.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping card */}
          <div
            className="rounded-2xl border border-white/[0.07] bg-black/50 p-5 backdrop-blur-xl"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-bone/40">Ships To</p>
              <button onClick={onChangeShipping} className="text-xs text-blood transition-colors hover:text-blood/70">
                Edit
              </button>
            </div>
            <div className="space-y-1 text-sm text-offwhite/75">
              <p className="font-semibold text-offwhite">{form.name}</p>
              <p>{form.address}</p>
              <p>{form.city}, {form.state} {form.pincode}</p>
              <p className="text-bone/45">{form.email} · {form.phone}</p>
              {form.gstNumber && (
                <p className="text-bone/45">
                  GST: {form.gstNumber}
                  {form.gstBusinessName && <span className="text-bone/30"> — {form.gstBusinessName}</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Payment */}
        <div
          className="relative overflow-hidden rounded-2xl border border-blood/20 bg-black/60 p-7 backdrop-blur-xl"
          style={{
            boxShadow: "0 0 80px rgba(176,0,32,0.14), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blood/60 to-transparent" />
          {/* Radial blood glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(176,0,32,0.1),transparent_55%)]" />

          <div className="relative z-10">
            <p className="mb-6 text-[10px] uppercase tracking-[0.28em] text-bone/40">Payment Summary</p>

            <div className="space-y-3.5 text-sm">
              {appliedPromo ? (
                <>
                  <div className="flex justify-between text-bone/55">
                    <span>{selected.title} ({selected.qty} cans)</span>
                    <span className="text-offwhite">₹{selected.price.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-2">
                      Discount ({appliedPromo.code})
                      <button onClick={onRemovePromo} className="text-[10px] text-bone/30 hover:text-blood transition-colors">✕</button>
                    </span>
                    <span>−₹{appliedPromo.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-bone/55">
                    <span>Subtotal (excl. GST)</span>
                    <span className="text-offwhite">₹{getBasePrice(effectiveTotal).toLocaleString("en-IN")}</span>
                  </div>
                  <GstRows amount={effectiveTotal} buyerState={form.state} />
                </>
              ) : (
                <>
                  <div className="flex justify-between text-bone/55">
                    <span>{selected.title} ({selected.qty} cans)</span>
                    <span className="text-offwhite">₹{getBasePrice(selected.price).toLocaleString("en-IN")}</span>
                  </div>
                  <GstRows amount={selected.price} buyerState={form.state} />
                </>
              )}
              <div className="flex justify-between text-bone/55">
                <span>Shipping</span>
                <span className="text-xs font-medium text-green-400">FREE</span>
              </div>
            </div>

            {/* Promo code input */}
            {!appliedPromo && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null) }}
                    placeholder="Promo code"
                    className="flex-1 rounded-lg border border-white/[0.08] bg-black/50 px-3 py-2 text-xs text-offwhite placeholder:text-bone/20 outline-none transition-colors focus:border-blood/40"
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  />
                  <button
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="rounded-lg border border-blood/30 bg-blood/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-blood transition-all hover:bg-blood/20 disabled:opacity-40"
                  >
                    {promoLoading ? "..." : "Apply"}
                  </button>
                </div>
                {promoError && (
                  <p className="mt-1.5 text-[11px] text-blood/80">{promoError}</p>
                )}
              </div>
            )}

            {nextPack && (
              <div className="mt-5 rounded-xl border border-blood/50 bg-blood/10 p-4 transition-all hover:border-blood hover:bg-blood/20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-blood mb-1 animate-pulse-slow">One-Time Offer</span>
                    <p className="text-sm font-semibold text-offwhite">Upgrade to {nextPack.title} ({nextPack.qty} cans)</p>
                    <p className="text-[10px] mt-1 text-bone/60">Best value. Add it for just ₹{(nextPack.price - effectiveTotal).toLocaleString("en-IN")} more.</p>
                  </div>
                  <button 
                    onClick={() => onUpgradeProduct(nextPack)} 
                    disabled={loading}
                    className="btn btn-primary px-5 py-2.5 text-[11px] w-full sm:w-auto shadow-[0_0_20px_rgba(176,0,32,0.3)]"
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            )}

            <div className="my-6 h-px bg-white/[0.06]" />

            <div className="flex items-center justify-between">
              <span className="font-cinzel text-lg font-bold text-offwhite">Total</span>
              <span className="font-cinzel text-2xl font-black text-blood">
                ₹{effectiveTotal.toLocaleString("en-IN")}
              </span>
            </div>

            {payError && (
              <div className="mt-4 rounded-xl border border-blood/30 bg-blood/10 px-5 py-4">
                <p className="text-xs font-semibold text-blood">{payError}</p>
                <div className="mt-3 flex items-center gap-3 text-[10px]">
                  <button
                    onClick={onPay}
                    className="rounded-md bg-blood/20 px-3 py-1.5 font-semibold uppercase tracking-wider text-blood transition-colors hover:bg-blood/30"
                  >
                    Try Again
                  </button>
                  <a
                    href="/contact"
                    className="text-bone/40 underline underline-offset-2 transition-colors hover:text-bone/60"
                  >
                    Contact support
                  </a>
                </div>
              </div>
            )}

            {/* Pay CTA */}
            <motion.button
              onClick={onPay}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, filter: "brightness(1.1)" } : undefined}
              whileTap={!loading ? { scale: 0.98 } : undefined}
              className="relative mt-6 w-full overflow-hidden rounded-xl bg-blood py-5 text-base font-bold text-white transition-all duration-300 disabled:opacity-60"
              style={{
                boxShadow: "0 0 50px rgba(176,0,32,0.5), 0 8px 32px rgba(176,0,32,0.35)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="font-cinzel tracking-wider">Processing Ritual...</span>
                </span>
              ) : (
                <span className="font-cinzel tracking-wider">
                  Complete Ritual · ₹{effectiveTotal.toLocaleString("en-IN")}
                </span>
              )}
            </motion.button>

            {/* Trust badges */}
            <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-[11px] text-bone/40">
                <LockIcon />
                <span>256-bit SSL Encrypted · PCI DSS Compliant</span>
              </div>
              <div className="flex justify-center gap-3 text-[10px] uppercase tracking-wider text-bone/25">
                <span>UPI</span><span>·</span>
                <span>Cards</span><span>·</span>
                <span>Net Banking</span><span>·</span>
                <span>Wallets</span>
              </div>
              <div className="flex items-center justify-center gap-4 pt-1 text-[10px] text-bone/25">
                <span className="flex items-center gap-1">
                  <ShieldIcon />
                  Secure Checkout
                </span>
                <span className="flex items-center gap-1">
                  <TruckIcon />
                  Free Shipping
                </span>
                <span className="flex items-center gap-1">
                  <RefreshIcon />
                  Easy Returns
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button onClick={onBack} className="btn btn-ghost text-sm">← Back to shipping</button>
      </div>
    </div>
  )
}

/* ─── GST Tax Rows ─── */
function formatTaxAmount(amount: number) {
  const hasFraction = !Number.isInteger(amount)
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })
}

function GstRows({ amount, buyerState }: { amount: number; buyerState: string }) {
  const gst = getGstAmount(amount)
  if (isInterstate(buyerState)) {
    return (
      <div className="flex justify-between text-bone/55">
        <span>IGST (5%)</span>
        <span className="text-offwhite/60">₹{formatTaxAmount(gst)}</span>
      </div>
    )
  }
  const half = gst / 2
  return (
    <>
      <div className="flex justify-between text-bone/55">
        <span>CGST (2.5%)</span>
        <span className="text-offwhite/60">₹{formatTaxAmount(half)}</span>
      </div>
      <div className="flex justify-between text-bone/55">
        <span>SGST (2.5%)</span>
        <span className="text-offwhite/60">₹{formatTaxAmount(half)}</span>
      </div>
    </>
  )
}

/* ─── GST Lookup Field ─── */
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/

function GstLookupField({ value, businessName, onChange, onBlur }: {
  value: string
  businessName: string
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastLookedUp, setLastLookedUp] = useState("")

  const lookup = async (gstin: string) => {
    if (!GSTIN_REGEX.test(gstin) || gstin === lastLookedUp) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gst/verify?gstin=${encodeURIComponent(gstin)}`)
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data?.error || "Could not verify GSTIN.")
        onChange("gstBusinessName", "")
      } else {
        const name = data.tradeName || data.legalName || ""
        onChange("gstBusinessName", name)
        if (data.status && data.status !== "Active") {
          setError(`GSTIN status: ${data.status}`)
        }
      }
      setLastLookedUp(gstin)
    } catch {
      setError("Unable to verify GSTIN right now.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (f: keyof ShippingForm, v: string) => {
    const upper = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15)
    onChange("gstNumber", upper)
    // Clear business name when input changes
    if (upper !== lastLookedUp) {
      onChange("gstBusinessName", "")
      setError(null)
    }
  }

  const handleBlur = () => {
    onBlur("gstNumber")
    if (value && GSTIN_REGEX.test(value)) {
      lookup(value)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3.5">
      <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-bone/35">For Business / GST Invoice (Optional)</p>
      <div>
        <label htmlFor="field-gstNumber" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-bone/45">
          GST Number
        </label>
        <div className="relative">
          <input
            id="field-gstNumber"
            type="text"
            value={value}
            placeholder="22AAAAA0000A1Z5"
            onChange={(e) => handleChange("gstNumber", e.target.value)}
            onBlur={handleBlur}
            className={`w-full rounded-xl border bg-black/50 px-4 py-3 text-sm text-offwhite placeholder:text-bone/20 outline-none transition-all duration-200 focus:border-blood/60 focus:ring-1 focus:ring-blood/20 ${
              error ? "border-blood/60" : "border-white/[0.08]"
            }`}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-bone/20 border-t-blood" />
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-[11px] text-blood/80">{error}</p>}
        {businessName && !error && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-500/5 border border-green-500/10 px-3 py-2">
            <svg className="h-3.5 w-3.5 shrink-0 text-green-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 8.5l3.5 3.5 6.5-7" />
            </svg>
            <span className="text-[12px] text-green-400/90">{businessName}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Luxury Form Field ─── */
function LuxField({ label, field, value, error, placeholder, type = "text", onChange, onBlur }: {
  label: string
  field: keyof ShippingForm
  value: string
  error?: string
  placeholder: string
  type?: string
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
}) {
  const inputId = `field-${field}`
  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-bone/45">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(field, e.target.value)}
        onBlur={() => onBlur(field)}
        className={`w-full rounded-xl border bg-black/50 px-4 py-3 text-sm text-offwhite placeholder:text-bone/20 outline-none transition-all duration-200 focus:border-blood/60 focus:ring-1 focus:ring-blood/20 ${
          error ? "border-blood/60" : "border-white/[0.08]"
        }`}
      />
      {error && <p className="mt-1.5 text-xs text-blood" role="alert">{error}</p>}
    </div>
  )
}

/* ─── Icons ─── */
function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-bone/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
