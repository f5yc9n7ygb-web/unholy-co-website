"use client"

import Script from "next/script"
import Image from "next/image"
import { useState, useEffect } from "react"
import heroCan from "../../../public/can.png"

/* ── Types ── */
type Pack = {
  id: string
  title: string
  qty: number
  price: number
  perCan: number
  blurb: string
  tag?: string
}

type ShippingForm = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  pincode: string
  state: string
}

type FormErrors = Partial<Record<keyof ShippingForm, string>>

type Step = "select" | "shipping" | "review"

declare global {
  interface Window {
    Razorpay: any
  }
}

/* ── Data ── */
const PACKS: Pack[] = [
  {
    id: "pack6",
    title: "Starter Ritual",
    qty: 6,
    price: 449,
    perCan: 74.83,
    blurb: "6 cans of cold-forged hydration. Perfect first taste.",
  },
  {
    id: "pack12",
    title: "Weekend Coven",
    qty: 12,
    price: 849,
    perCan: 70.75,
    blurb: "12 cans for the weekend warriors and night crawlers.",
    tag: "MOST POPULAR",
  },
  {
    id: "pack24",
    title: "True Believer",
    qty: 24,
    price: 1599,
    perCan: 66.63,
    blurb: "24 cans. Full commitment. Maximum savings.",
    tag: "BEST VALUE",
  },
]

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
]

/* ── Helpers ── */
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
const STEP_LABELS: Record<Step, string> = {
  select: "Choose Pack",
  shipping: "Shipping",
  review: "Review & Pay",
}

/* ── Main Component ── */
export function ShopClient() {
  const [step, setStep] = useState<Step>("select")
  const [selected, setSelected] = useState<Pack>(PACKS[1])
  const [loading, setLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [form, setForm] = useState<ShippingForm>({
    name: "", email: "", phone: "", address: "", city: "", pincode: "", state: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const orderEndpoint = process.env.NEXT_PUBLIC_WORKER_ORDER_ENDPOINT

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
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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
    if (!key || !orderEndpoint) {
      setPayError("Payment gateway is not configured.")
      return
    }
    setLoading(true)
    setPayError(null)
    try {
      const res = await fetch(orderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selected.price * 100,
          currency: "INR",
          receipt: `${selected.id}_${Date.now()}`,
          notes: {
            product: selected.title,
            qty: selected.qty,
            ...form,
          },
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || "Order error")

      const rz = new window.Razorpay({
        key,
        order_id: data.order.id,
        name: "UNHOLY CO.",
        description: `${selected.title} — ${selected.qty} cans`,
        image: "/favicon.svg",
        handler: (response: any) => {
          window.location.href = `/thanks?order=${data.order.id}&pay=${response.razorpay_payment_id}&pack=${selected.id}&qty=${selected.qty}`
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        notes: { address: `${form.address}, ${form.city} ${form.pincode}, ${form.state}` },
        theme: { color: "#B00020" },
        modal: { ondismiss: () => setLoading(false) },
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
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="section">
        <div className="container max-w-5xl space-y-8">

        {/* ── Step Indicator ── */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => i < stepIndex && go(s)}
                disabled={i > stepIndex}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                  s === step
                    ? "bg-blood text-white shadow-[0_0_20px_rgba(176,0,32,0.4)]"
                    : i < stepIndex
                      ? "bg-ash/40 text-bone/80 hover:bg-ash/60"
                      : "bg-ash/20 text-bone/30"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  s === step ? "bg-white/20" : i < stepIndex ? "bg-blood/30 text-blood" : "bg-ash/30"
                }`}>
                  {i < stepIndex ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 transition-colors ${i < stepIndex ? "bg-blood/50" : "bg-ash/30"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ═══ STEP 1: SELECT PACK ═══ */}
        {step === "select" && (
          <div className="animate-step-in space-y-8">
            <div className="text-center space-y-2">
              <h1 className="h1">Choose Your Ritual</h1>
              <p className="p">Select your pack. Free shipping on all orders.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {PACKS.map((pack) => {
                const isActive = selected.id === pack.id
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelected(pack)}
                    className={`relative rounded-2xl border p-5 md:p-6 text-left transition-all duration-300 ${
                      isActive
                        ? "border-blood/60 bg-ash/30 shadow-[0_0_40px_rgba(176,0,32,0.2)]"
                        : "border-ash/40 bg-ash/15 hover:border-ash/70 hover:bg-ash/20"
                    }`}
                  >
                    {pack.tag && (
                      <span className="absolute -top-3 left-5 rounded-full bg-blood px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(176,0,32,0.4)]">
                        {pack.tag}
                      </span>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-bone/50">{pack.qty} cans</span>
                        <h3 className="mt-1 text-lg font-semibold text-offwhite">{pack.title}</h3>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                        isActive ? "border-blood bg-blood" : "border-ash/60"
                      }`}>
                        {isActive && (
                          <svg
                            className="h-3 w-3 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-offwhite/60">{pack.blurb}</p>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <span className="text-3xl font-bold text-offwhite">₹{pack.price}</span>
                        <span className="ml-2 text-xs text-bone/40">₹{pack.perCan.toFixed(0)}/can</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Bottom summary strip */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-ash/40 bg-ash/15 backdrop-blur-md px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-10 shrink-0">
                  <Image src={heroCan} alt="BloodThirst" fill className="object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-offwhite">{selected.title}</p>
                  <p className="text-xs text-bone/50">{selected.qty} cans &middot; Free shipping</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xl font-bold text-offwhite">₹{selected.price}</p>
                  <p className="text-[10px] uppercase tracking-wider text-bone/40">incl. taxes</p>
                </div>
                <button onClick={() => go("shipping")} className="btn btn-primary">
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: SHIPPING ═══ */}
        {step === "shipping" && (
          <div className="animate-step-in space-y-8">
            <div className="text-center space-y-2">
              <h2 className="h2">Shipping Details</h2>
              <p className="p">Where should we send your ritual supply?</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full Name" field="name" value={form.name} error={errors.name} placeholder="John Doe" onChange={updateField} onBlur={blurField} />
                  <Field label="Email" field="email" value={form.email} error={errors.email} placeholder="you@domain.com" type="email" onChange={updateField} onBlur={blurField} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Phone" field="phone" value={form.phone} error={errors.phone} placeholder="9876543210" type="tel" onChange={updateField} onBlur={blurField} />
                  <Field label="Pincode" field="pincode" value={form.pincode} error={errors.pincode} placeholder="110001" onChange={updateField} onBlur={blurField} />
                </div>
                <Field label="Address" field="address" value={form.address} error={errors.address} placeholder="House no., Street, Locality" onChange={updateField} onBlur={blurField} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="City" field="city" value={form.city} error={errors.city} placeholder="Mumbai" onChange={updateField} onBlur={blurField} />
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-bone/60">State</label>
                    <select
                      value={form.state}
                      onChange={(e) => updateField("state", e.target.value)}
                      onBlur={() => blurField("state")}
                      className={`w-full rounded-xl border bg-ash/40 px-3 py-2.5 text-sm text-offwhite outline-none transition focus:border-blood focus:ring-2 focus:ring-blood/30 ${errors.state ? "border-blood/60" : "border-ash"}`}
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <p className="mt-1 text-xs text-blood/80">{errors.state}</p>}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => go("select")} className="btn btn-ghost">Back</button>
                  <button onClick={goToReview} className="btn btn-primary flex-1">Review Order</button>
                </div>
              </div>

              {/* Mini summary sidebar */}
              <div className="rounded-2xl border border-ash/40 bg-ash/15 p-5 h-fit lg:sticky lg:top-28">
                <h3 className="text-xs uppercase tracking-wider text-bone/50">Order Summary</h3>
                <div className="mt-4 flex items-center gap-3">
                  <div className="relative h-16 w-12 shrink-0">
                    <Image src={heroCan} alt="BloodThirst" fill className="object-contain" />
                  </div>
                  <div>
                    <p className="font-semibold text-offwhite">{selected.title}</p>
                    <p className="text-xs text-bone/50">{selected.qty} cans</p>
                  </div>
                </div>
                <div className="mt-6 space-y-2 border-t border-ash/30 pt-4 text-sm">
                  <div className="flex justify-between text-bone/60">
                    <span>Subtotal</span><span className="text-offwhite">₹{selected.price}</span>
                  </div>
                  <div className="flex justify-between text-bone/60">
                    <span>Shipping</span><span className="text-xs font-medium text-green-400">FREE</span>
                  </div>
                  <div className="flex justify-between border-t border-ash/30 pt-3 text-base font-bold text-offwhite">
                    <span>Total</span><span>₹{selected.price}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-ash/20 px-3 py-2 text-[11px] text-bone/50">
                  <LockIcon />
                  Secured by Razorpay &middot; 256-bit encryption
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: REVIEW & PAY ═══ */}
        {step === "review" && (
          <div className="animate-step-in space-y-8">
            <div className="text-center space-y-2">
              <h2 className="h2">Review Your Ritual</h2>
              <p className="p">Everything look good? Complete the offering below.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                {/* Product card */}
                <div className="rounded-2xl border border-ash/40 bg-ash/15 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider text-bone/50">Product</h3>
                    <button onClick={() => go("select")} className="text-xs text-blood hover:underline">Change</button>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="relative h-20 w-14 shrink-0 rounded-lg bg-ash/20 p-1">
                      <Image src={heroCan} alt="BloodThirst" fill className="object-contain" />
                    </div>
                    <div>
                      <p className="font-semibold text-offwhite">{selected.title}</p>
                      <p className="text-sm text-bone/50">{selected.qty} cans &middot; ₹{selected.perCan.toFixed(0)}/can</p>
                      <p className="mt-1 text-xl font-bold text-offwhite">₹{selected.price}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping card */}
                <div className="rounded-2xl border border-ash/40 bg-ash/15 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider text-bone/50">Ships To</h3>
                    <button onClick={() => go("shipping")} className="text-xs text-blood hover:underline">Edit</button>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-offwhite/80">
                    <p className="font-semibold text-offwhite">{form.name}</p>
                    <p>{form.address}</p>
                    <p>{form.city}, {form.state} {form.pincode}</p>
                    <p className="text-bone/50">{form.email} &middot; {form.phone}</p>
                  </div>
                </div>
              </div>

              {/* Payment card */}
              <div className="rounded-2xl border border-blood/20 bg-ash/15 p-6 shadow-[0_0_60px_rgba(176,0,32,0.1)]">
                <h3 className="text-xs uppercase tracking-wider text-bone/50">Payment Summary</h3>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between text-bone/60">
                    <span>{selected.title} ({selected.qty})</span>
                    <span className="text-offwhite">₹{selected.price}</span>
                  </div>
                  <div className="flex justify-between text-bone/60">
                    <span>Shipping</span>
                    <span className="text-xs font-medium text-green-400">FREE</span>
                  </div>
                  <div className="flex justify-between text-bone/60">
                    <span>Taxes</span>
                    <span className="text-offwhite text-xs">Included</span>
                  </div>
                </div>

                <div className="my-5 h-px bg-ash/30" />

                <div className="flex justify-between text-lg font-bold text-offwhite">
                  <span>Total</span><span>₹{selected.price}</span>
                </div>

                {payError && (
                  <div className="mt-3 rounded-lg bg-blood/10 border border-blood/30 px-3 py-2 text-xs text-blood">
                    {payError}
                  </div>
                )}

                <button onClick={onPay} disabled={loading} className="btn btn-primary mt-6 w-full py-4 text-base">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Pay ₹${selected.price}`
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-bone/40">
                  <LockIcon />
                  Powered by Razorpay &middot; 256-bit SSL
                </div>
                <div className="mt-3 flex justify-center gap-3 text-[10px] text-bone/30">
                  <span>UPI</span><span>&middot;</span>
                  <span>Cards</span><span>&middot;</span>
                  <span>Net Banking</span><span>&middot;</span>
                  <span>Wallets</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button onClick={() => go("shipping")} className="btn btn-ghost text-sm">&larr; Back to shipping</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

/* ── Reusable Field ── */
function Field({
  label, field, value, error, placeholder, type = "text",
  onChange, onBlur,
}: {
  label: string
  field: keyof ShippingForm
  value: string
  error?: string
  placeholder: string
  type?: string
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-bone/60">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(field, e.target.value)}
        onBlur={() => onBlur(field)}
        className={`w-full rounded-xl border bg-ash/40 px-3 py-2.5 text-sm text-offwhite outline-none transition focus:border-blood focus:ring-2 focus:ring-blood/30 ${error ? "border-blood/60" : "border-ash"}`}
      />
      {error && (
        <p className="mt-1 text-xs text-blood/80">{error}</p>
      )}
    </div>
  )
}

/* ── Lock Icon ── */
function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-bone/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
