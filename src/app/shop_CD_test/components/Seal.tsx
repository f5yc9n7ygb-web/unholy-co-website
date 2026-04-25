"use client"

import { forwardRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Pack } from "@/lib/shop/catalog"
import type { ShippingForm } from "@/lib/shop/types"
import { RollingPrice } from "./RollingPrice"

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
]

export type FormErrors = Partial<Record<keyof ShippingForm, string>>

export const Seal = forwardRef<
  HTMLElement,
  {
    selected: Pack
    form: ShippingForm
    errors: FormErrors
    loading: boolean
    payError: string | null
    onChange: (field: keyof ShippingForm, value: string) => void
    onBlur: (field: keyof ShippingForm) => void
    onSeal: () => void
    wax: boolean
  }
>(function Seal(
  { selected, form, errors, loading, payError, onChange, onBlur, onSeal, wax },
  ref
) {
  const total = selected.price

  return (
    <section
      ref={ref}
      id="seal"
      className="relative overflow-hidden bg-black py-24 pb-36 md:py-32 md:pb-40"
      aria-labelledby="seal-heading"
    >
      {/* Background atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 700px 500px at 50% 30%, rgba(176,0,32,0.15), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(176,0,32,0.5) 50%, transparent 100%)",
        }}
      />

      <div className="container relative mx-auto max-w-2xl px-4">
        {/* Heading */}
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.5em] text-blood/70 md:text-[11px]">
            // final step
          </p>
          <h2
            id="seal-heading"
            className="font-cinzel text-3xl font-black uppercase leading-[0.95] text-offwhite md:text-5xl"
          >
            Seal<br />
            <span className="text-blood">the pact.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm text-bone/50 md:text-base">
            One pact. No revisions. The can ships cold within 72 hours of sealing.
          </p>
        </div>

        {/* Order summary card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7 }}
          className="mb-8 rounded-2xl border border-blood/30 bg-black/50 p-5 backdrop-blur-xl md:p-6"
          style={{
            boxShadow: "0 0 50px rgba(176,0,32,0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-blood/70 md:text-[10px]">
                Your pact
              </p>
              <p className="mt-1 font-cinzel text-base font-bold uppercase tracking-[0.15em] text-offwhite md:text-lg">
                {selected.title} · {selected.qty} cans
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-bone/40 md:text-[11px]">
                Incl. GST · Free shipping
              </p>
            </div>
            <div className="text-right">
              <RollingPrice
                value={total}
                prefix="₹"
                className="font-cinzel text-2xl font-black text-offwhite md:text-3xl"
              />
            </div>
          </div>
        </motion.div>

        {/* The form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 backdrop-blur-xl md:p-8"
        >
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.35em] text-bone/40">
            // address the pact to...
          </p>

          <div className="space-y-4">
            <Field
              label="Name"
              field="name"
              value={form.name}
              error={errors.name}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="How shall we address you?"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Phone"
                field="phone"
                value={form.phone}
                error={errors.phone}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="10-digit mobile"
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
                placeholder="for your receipt"
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <Field
              label="Address"
              field="address"
              value={form.address}
              error={errors.address}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Where does the ritual begin?"
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
                placeholder=""
                autoComplete="address-level2"
              />
              <Field
                label="Pincode"
                field="pincode"
                value={form.pincode}
                error={errors.pincode}
                onChange={onChange}
                onBlur={onBlur}
                placeholder=""
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
                  className="w-full rounded-xl border border-white/[0.08] bg-black/60 px-4 py-3 text-sm text-offwhite outline-none transition-colors focus:border-blood/50"
                >
                  <option value="">—</option>
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
          </div>

          {/* Error */}
          <AnimatePresence>
            {payError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 rounded-lg border border-blood/40 bg-blood/10 px-4 py-3 font-mono text-xs text-blood"
              >
                {payError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* The button */}
          <div className="relative mt-8">
            <button
              type="button"
              onClick={onSeal}
              disabled={loading || wax}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-blood py-4 font-cinzel text-sm font-black uppercase tracking-[0.3em] text-white transition-all hover:scale-[1.01] disabled:cursor-wait disabled:opacity-80 md:py-5 md:text-base"
              style={{
                boxShadow:
                  "0 0 50px rgba(176,0,32,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <span
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[900ms] group-hover:translate-x-full"
                aria-hidden="true"
              />
              {/* Heartbeat pulse */}
              <span
                className="absolute inset-0 rounded-xl"
                style={{ boxShadow: "0 0 0 0 rgba(176,0,32,0.6)" }}
                aria-hidden="true"
              />
              <span className="relative">
                {loading
                  ? "Opening the gate…"
                  : wax
                  ? "Sealing…"
                  : `Seal the pact — ₹${total.toLocaleString("en-IN")}`}
              </span>
            </button>

            {/* Wax seal animation */}
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
                    className="h-20 w-20 rounded-full border-2 border-blood bg-gradient-radial from-blood via-[#7A0016] to-[#400008]"
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

          {/* Trust micro-copy */}
          <div className="mt-5 flex items-center justify-center gap-4 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/40 md:text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blood/60" />
              Razorpay
            </span>
            <span className="text-bone/20">·</span>
            <span>UPI · Cards · Netbanking</span>
            <span className="text-bone/20">·</span>
            <span>Secure</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
})

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
        <input id={`seal-${field}`} type="text" {...common} />
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
