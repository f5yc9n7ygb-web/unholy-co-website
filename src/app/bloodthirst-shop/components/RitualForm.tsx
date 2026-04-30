"use client"

import { motion } from "framer-motion"
import type { ShippingForm } from "@/lib/shop/types"
import { INDIAN_STATES, type FormErrors } from "../hooks/useRitualCheckout"

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
