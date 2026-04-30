"use client"

import { forwardRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getBasePrice, getGstAmount, type Pack } from "@/lib/shop/catalog"
import type { ShippingForm } from "@/lib/shop/types"
import type { AppliedPromo } from "../ShopCDTestClient"
import { RollingPrice } from "./RollingPrice"

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
]

const SUPPLIER_STATE = "Uttar Pradesh"
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/

export type FormErrors = Partial<Record<keyof ShippingForm, string>>

function isInterstate(buyerState: string): boolean {
  return !!buyerState && buyerState !== SUPPLIER_STATE
}

function formatTaxAmount(amount: number) {
  const hasFraction = !Number.isInteger(amount)
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })
}

export const Seal = forwardRef<
  HTMLElement,
  {
    selected: Pack
    form: ShippingForm
    errors: FormErrors
    loading: boolean
    payError: string | null
    appliedPromo: AppliedPromo | null
    onApplyPromo: (promo: AppliedPromo) => void
    onRemovePromo: () => void
    onChange: (field: keyof ShippingForm, value: string) => void
    onBlur: (field: keyof ShippingForm) => void
    onSeal: () => void
    wax: boolean
  }
>(function Seal(
  {
    selected,
    form,
    errors,
    loading,
    payError,
    appliedPromo,
    onApplyPromo,
    onRemovePromo,
    onChange,
    onBlur,
    onSeal,
    wax,
  },
  ref
) {
  const total = appliedPromo ? appliedPromo.finalPrice : selected.price

  return (
    <section
      ref={ref}
      id="seal"
      className="relative overflow-hidden bg-black py-20 pb-36 md:py-28 md:pb-40"
      aria-labelledby="seal-heading"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 700px 500px at 50% 25%, rgba(176,0,32,0.15), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(176,0,32,0.5) 50%, transparent 100%)",
        }}
      />

      <div className="container relative mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.5em] text-blood/70 md:text-[11px]">
            // checkout
          </p>
          <h2
            id="seal-heading"
            className="font-cinzel text-3xl font-black uppercase leading-[0.95] text-offwhite md:text-5xl"
          >
            Review<br />
            <span className="text-blood">and pay.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-sm text-bone/50 md:text-base">
            Confirm your pack, apply any code, add GST details if needed, and pay securely through Razorpay.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl border border-white/[0.06] bg-black/45 p-5 backdrop-blur-xl md:p-8"
          >
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.35em] text-bone/40">
              // delivery details
            </p>

            <div className="space-y-4">
              <Field
                label="Full name"
                field="name"
                value={form.name}
                error={errors.name}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="John Doe"
                autoComplete="name"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Phone"
                  field="phone"
                  value={form.phone}
                  error={errors.phone}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="9876543210"
                  inputMode="tel"
                  autoComplete="tel"
                />
                <Field
                  label="Email"
                  field="email"
                  value={form.email}
                  error={errors.email}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="you@domain.com"
                  inputMode="email"
                  autoComplete="email"
                  type="email"
                />
              </div>

              <Field
                label="Street address"
                field="address"
                value={form.address}
                error={errors.address}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="House no., street, locality"
                multiline
                autoComplete="street-address"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label="City"
                  field="city"
                  value={form.city}
                  error={errors.city}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="Mumbai"
                  autoComplete="address-level2"
                />
                <Field
                  label="Pincode"
                  field="pincode"
                  value={form.pincode}
                  error={errors.pincode}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="110001"
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
                <div className="space-y-1.5">
                  <label
                    htmlFor="seal-state"
                    className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50"
                  >
                    State
                  </label>
                  <select
                    id="seal-state"
                    value={form.state}
                    onChange={(e) => onChange("state", e.target.value)}
                    onBlur={() => onBlur("state")}
                    className={`w-full rounded-xl border bg-black/60 px-4 py-3 text-sm outline-none transition-colors focus:border-blood/50 ${
                      form.state ? "text-offwhite" : "text-bone/25"
                    } ${errors.state ? "border-blood/60" : "border-white/[0.08]"}`}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blood">
                      {errors.state}
                    </p>
                  )}
                </div>
              </div>

              <GstLookupField
                value={form.gstNumber ?? ""}
                businessName={form.gstBusinessName ?? ""}
                onChange={onChange}
                onBlur={onBlur}
              />
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="rounded-2xl border border-blood/25 bg-black/60 p-5 backdrop-blur-xl lg:sticky lg:top-28 md:p-6"
            style={{
              boxShadow: "0 0 70px rgba(176,0,32,0.14), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/40">
              // order review
            </p>

            <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-cinzel text-base font-bold uppercase tracking-[0.12em] text-offwhite">
                    {selected.title}
                  </p>
                  <p className="mt-1 text-xs text-bone/45">
                    {selected.qty} x BloodThirst 500ml
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-bone/35">
                    ₹{selected.perCan}/can · free shipping
                  </p>
                </div>
                <RollingPrice
                  value={selected.price}
                  prefix="₹"
                  className="font-cinzel text-2xl font-black text-offwhite"
                />
              </div>
            </div>

            <PromoBox
              selected={selected}
              appliedPromo={appliedPromo}
              onApplyPromo={onApplyPromo}
              onRemovePromo={onRemovePromo}
            />

            <div className="mt-5 space-y-3 border-y border-white/[0.06] py-5 text-sm">
              {appliedPromo && (
                <>
                  <SummaryRow label="Pack price" value={`₹${selected.price.toLocaleString("en-IN")}`} />
                  <SummaryRow
                    label={`Discount (${appliedPromo.code})`}
                    value={`-₹${appliedPromo.discountAmount.toLocaleString("en-IN")}`}
                    tone="green"
                  />
                </>
              )}
              <SummaryRow
                label="Subtotal excl. GST"
                value={`₹${getBasePrice(total).toLocaleString("en-IN")}`}
              />
              <GstRows amount={total} buyerState={form.state} />
              <SummaryRow label="Shipping" value="FREE" tone="green" />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-cinzel text-lg font-bold text-offwhite">Total</span>
              <RollingPrice
                value={total}
                prefix="₹"
                className="font-cinzel text-3xl font-black text-blood"
              />
            </div>

            <AnimatePresence>
              {payError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-5 rounded-xl border border-blood/40 bg-blood/10 px-4 py-3"
                >
                  <p className="text-xs font-semibold text-blood">{payError}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px]">
                    <button
                      type="button"
                      onClick={onSeal}
                      className="rounded-md bg-blood/20 px-3 py-1.5 font-semibold uppercase tracking-wider text-blood transition-colors hover:bg-blood/30"
                    >
                      Try again
                    </button>
                    <a
                      href="/contact"
                      className="text-bone/45 underline underline-offset-2 transition-colors hover:text-bone/70"
                    >
                      Contact support
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative mt-6">
              <button
                type="button"
                onClick={onSeal}
                disabled={loading || wax}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-blood py-4 font-cinzel text-sm font-black uppercase tracking-[0.24em] text-white transition-all hover:scale-[1.01] disabled:cursor-wait disabled:opacity-80 md:py-5"
                style={{
                  boxShadow:
                    "0 0 50px rgba(176,0,32,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[900ms] group-hover:translate-x-full"
                  aria-hidden="true"
                />
                <span className="relative">
                  {loading
                    ? "Opening Razorpay..."
                    : wax
                    ? "Preparing checkout..."
                    : `Pay securely - ₹${total.toLocaleString("en-IN")}`}
                </span>
              </button>

              <AnimatePresence>
                {wax && (
                  <motion.div
                    key="wax"
                    className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div
                      className="h-20 w-20 rounded-full border-2 border-blood"
                      style={{
                        background:
                          "radial-gradient(circle at 35% 30%, #E04060, #B00020 40%, #500010 85%)",
                        boxShadow:
                          "0 0 40px rgba(176,0,32,0.9), inset -6px -8px 14px rgba(0,0,0,0.5), inset 4px 4px 8px rgba(255,120,140,0.3)",
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-center">
              <div className="text-[11px] text-bone/45">
                Razorpay secure checkout · 256-bit SSL · PCI DSS compliant
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.22em] text-bone/30">
                <span>UPI</span>
                <span>Cards</span>
                <span>Net banking</span>
                <span>Wallets</span>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  )
})

function PromoBox({
  selected,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
}: {
  selected: Pack
  appliedPromo: AppliedPromo | null
  onApplyPromo: (promo: AppliedPromo) => void
  onRemovePromo: () => void
}) {
  const [promoInput, setPromoInput] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  const applyPromo = async () => {
    if (!promoInput.trim() || promoLoading) return
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

  if (appliedPromo) {
    return (
      <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-green-400">
              Code applied
            </p>
            <p className="mt-1 text-bone/65">
              {appliedPromo.code} saved ₹{appliedPromo.discountAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemovePromo}
            className="text-xs font-semibold uppercase tracking-wider text-bone/40 transition-colors hover:text-blood"
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-5">
      <label
        htmlFor="seal-promo"
        className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-bone/40"
      >
        Promo code
      </label>
      <div className="flex gap-2">
        <input
          id="seal-promo"
          type="text"
          value={promoInput}
          onChange={(e) => {
            setPromoInput(e.target.value.toUpperCase())
            setPromoError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyPromo()
          }}
          placeholder="CULT10"
          className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/60 px-4 py-3 text-sm uppercase text-offwhite outline-none transition-colors placeholder:text-bone/25 focus:border-blood/50"
        />
        <button
          type="button"
          onClick={applyPromo}
          disabled={promoLoading || !promoInput.trim()}
          className="rounded-xl border border-blood/35 bg-blood/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-blood transition-colors hover:bg-blood/20 disabled:opacity-40"
        >
          {promoLoading ? "..." : "Apply"}
        </button>
      </div>
      {promoError && <p className="mt-2 text-xs text-blood/80">{promoError}</p>}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "green"
}) {
  return (
    <div className="flex justify-between gap-4 text-bone/55">
      <span>{label}</span>
      <span className={tone === "green" ? "font-medium text-green-400" : "text-offwhite/70"}>
        {value}
      </span>
    </div>
  )
}

function GstRows({ amount, buyerState }: { amount: number; buyerState: string }) {
  const gst = getGstAmount(amount)
  if (isInterstate(buyerState)) {
    return <SummaryRow label="IGST (5%)" value={`₹${formatTaxAmount(gst)}`} />
  }

  const half = gst / 2
  return (
    <>
      <SummaryRow label="CGST (2.5%)" value={`₹${formatTaxAmount(half)}`} />
      <SummaryRow label="SGST (2.5%)" value={`₹${formatTaxAmount(half)}`} />
    </>
  )
}

function GstLookupField({
  value,
  businessName,
  onChange,
  onBlur,
}: {
  value: string
  businessName: string
  onChange: (field: keyof ShippingForm, value: string) => void
  onBlur: (field: keyof ShippingForm) => void
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

  const handleChange = (raw: string) => {
    const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15)
    onChange("gstNumber", upper)
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
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bone/35">
        Business / GST invoice optional
      </p>
      <label
        htmlFor="seal-gstNumber"
        className="mb-2 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50"
      >
        GST number
      </label>
      <div className="relative">
        <input
          id="seal-gstNumber"
          type="text"
          value={value}
          placeholder="22AAAAA0000A1Z5"
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={`w-full rounded-xl border bg-black/60 px-4 py-3 text-sm uppercase text-offwhite outline-none transition-colors placeholder:text-bone/25 focus:border-blood/50 ${
            error ? "border-blood/60" : "border-white/[0.08]"
          }`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-bone/20 border-t-blood" />
        )}
      </div>
      {error && <p className="mt-2 text-xs text-blood/80">{error}</p>}
      {businessName && !error && (
        <div className="mt-2 rounded-lg border border-green-500/10 bg-green-500/5 px-3 py-2 text-[12px] text-green-400/90">
          {businessName}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  field,
  value,
  error,
  onChange,
  onBlur,
  placeholder,
  multiline,
  inputMode,
  autoComplete,
  type = "text",
}: {
  label: string
  field: keyof ShippingForm
  value: string
  error?: string
  onChange: (field: keyof ShippingForm, value: string) => void
  onBlur: (field: keyof ShippingForm) => void
  placeholder?: string
  multiline?: boolean
  inputMode?: "tel" | "email" | "numeric"
  autoComplete?: string
  type?: string
}) {
  const [focused, setFocused] = useState(false)
  const common = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field, e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => {
      setFocused(false)
      onBlur(field)
    },
    placeholder,
    autoComplete,
    inputMode,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${field}-err` : undefined,
    className: `w-full rounded-xl border bg-black/60 px-4 py-3 text-sm text-offwhite outline-none transition-colors placeholder:text-bone/25 ${
      error
        ? "border-blood/60 focus:border-blood"
        : focused
        ? "border-blood/40"
        : "border-white/[0.08] hover:border-white/[0.14]"
    }`,
  }
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`seal-${field}`}
        className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50"
      >
        {label}
      </label>
      {multiline ? (
        <textarea id={`seal-${field}`} rows={2} {...common} />
      ) : (
        <input id={`seal-${field}`} type={type} {...common} />
      )}
      {error && (
        <p
          id={`${field}-err`}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-blood"
        >
          {error}
        </p>
      )}
    </div>
  )
}
