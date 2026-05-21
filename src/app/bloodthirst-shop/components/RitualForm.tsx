"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import type { ShippingForm } from "@/lib/shop/types"
import { GSTIN_REGEX, INDIAN_STATES, type FormErrors } from "../hooks/useRitualCheckout"

/**
 * Inline shipping form — gothic-luxe styled, single block, no step labels.
 * Reads as part of the manifesto block, not a separate checkout screen.
 */
export function RitualForm({
  form,
  errors,
  onChange,
  onBlur,
}: {
  form: ShippingForm
  errors: FormErrors
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood/70">
        Sign with the truth
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"        field="name"    value={form.name}    error={errors.name}    onChange={onChange} onBlur={onBlur} placeholder="As it appears on documents" />
        <Field label="Email"       field="email"   value={form.email}   error={errors.email}   onChange={onChange} onBlur={onBlur} placeholder="you@domain.com" type="email" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Phone"       field="phone"   value={form.phone}   error={errors.phone}   onChange={onChange} onBlur={onBlur} placeholder="10-digit mobile" type="tel" />
        <Field label="Pincode"     field="pincode" value={form.pincode} error={errors.pincode} onChange={onChange} onBlur={onBlur} placeholder="6-digit" />
      </div>
      <Field label="Address" field="address" value={form.address} error={errors.address} onChange={onChange} onBlur={onBlur} placeholder="House, street, locality" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City" field="city" value={form.city} error={errors.city} onChange={onChange} onBlur={onBlur} placeholder="City" />
        <div>
          <label htmlFor="rf-state" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45">
            State
          </label>
          <div className="relative">
            <select
              id="rf-state"
              value={form.state}
              onChange={(e) => onChange("state", e.target.value)}
              onBlur={() => onBlur("state")}
              className={`w-full appearance-none border bg-black/60 px-4 py-3 font-mono text-sm uppercase tracking-wider outline-none transition-colors duration-200 focus:border-blood/70 ${
                errors.state ? "border-blood/70" : "border-bone/15"
              } ${form.state ? "text-offwhite" : "text-bone/35"}`}
            >
              <option value="" disabled>Select</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s} className="text-black">
                  {s}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-bone/45">▾</span>
          </div>
          {errors.state && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-blood">{errors.state}</p>
          )}
        </div>
      </div>
      <GstLookupField
        value={form.gstNumber ?? ""}
        businessName={form.gstBusinessName ?? ""}
        error={errors.gstNumber}
        onChange={onChange}
        onBlur={onBlur}
      />
    </motion.div>
  )
}

function Field({
  label, field, value, error, onChange, onBlur, placeholder, type = "text",
}: {
  label: string
  field: keyof ShippingForm
  value: string
  error?: string
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
  placeholder?: string
  type?: string
}) {
  const id = `rf-${field}`
  const autoComplete: Partial<Record<keyof ShippingForm, string>> = {
    name: "name",
    email: "email",
    phone: "tel",
    address: "street-address",
    city: "address-level2",
    pincode: "postal-code",
  }
  const inputMode = field === "phone" || field === "pincode" ? "numeric" : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete[field]}
        inputMode={inputMode}
        onChange={(e) => onChange(field, e.target.value)}
        onBlur={() => onBlur(field)}
        className={`w-full border bg-black/60 px-4 py-3 font-mono text-sm tracking-wider text-offwhite placeholder:text-bone/25 outline-none transition-colors duration-200 focus:border-blood/70 ${
          error ? "border-blood/70" : "border-bone/15"
        }`}
      />
      {error && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-blood">{error}</p>
      )}
    </div>
  )
}

function GstLookupField({
  value,
  businessName,
  error: validationError,
  onChange,
  onBlur,
}: {
  value: string
  businessName: string
  error?: string
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
}) {
  const [loading, setLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lastLookedUp, setLastLookedUp] = useState("")
  const error = validationError || lookupError

  const lookup = async (gstin: string) => {
    if (!GSTIN_REGEX.test(gstin) || gstin === lastLookedUp) return
    setLoading(true)
    setLookupError(null)
    try {
      const res = await fetch(`/api/gst/verify?gstin=${encodeURIComponent(gstin)}`)
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setLookupError(data?.error || "Could not verify GSTIN.")
        onChange("gstBusinessName", "")
      } else {
        onChange("gstBusinessName", data.tradeName || data.legalName || "")
        if (data.status && data.status !== "Active") {
          setLookupError(`GSTIN status: ${data.status}`)
        }
      }
      setLastLookedUp(gstin)
    } catch {
      setLookupError("Unable to verify GSTIN right now.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (rawValue: string) => {
    const gstin = rawValue.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15)
    onChange("gstNumber", gstin)
    if (gstin !== lastLookedUp) {
      onChange("gstBusinessName", "")
      setLookupError(null)
      setLastLookedUp("")
    }
  }

  const handleBlur = () => {
    onBlur("gstNumber")
    lookup(value)
  }

  return (
    <div className="border border-bone/10 bg-black/35 px-4 py-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.32em] text-bone/38">
        Business / GST invoice (optional)
      </p>
      <label htmlFor="rf-gstNumber" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45">
        GST Number
      </label>
      <div className="relative">
        <input
          id="rf-gstNumber"
          type="text"
          value={value}
          placeholder="22AAAAA0000A1Z5"
          autoComplete="off"
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleBlur()
            }
          }}
          className={`w-full border bg-black/60 px-4 py-3 font-mono text-sm uppercase tracking-wider text-offwhite placeholder:text-bone/25 outline-none transition-colors duration-200 focus:border-blood/70 ${
            error ? "border-blood/70" : "border-bone/15"
          }`}
        />
        {loading && (
          <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-bone/20 border-t-blood" />
        )}
      </div>
      {error && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-blood" role="alert">
          {error}
        </p>
      )}
      {businessName && !error && (
        <p className="mt-2 border border-green-500/15 bg-green-500/[0.06] px-3 py-2 text-xs text-green-400/90">
          {businessName}
        </p>
      )}
    </div>
  )
}
