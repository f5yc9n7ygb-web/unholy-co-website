"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ShippingForm } from "@/lib/shop/types"
import {
  GSTIN_REGEX,
  INDIAN_STATES,
  type FormErrors,
} from "@/app/bloodthirst-shop/hooks/useRitualCheckout"
import { SIN_BUY } from "@/content/sin"

/**
 * Shipping form fields — forked from bloodthirst-shop/RitualForm and restyled
 * for the "Black Room". Same field ids (rf-*) and validation contract as the
 * shared form, so the hook's focus-jump-on-error still resolves every field.
 *
 * Split into two exported groups — {@link SinContactFields} and
 * {@link SinShippingFields} — so the focused checkout sheet can present them as
 * two steps (contact → shipping). GST stays collapsed behind a toggle; cold
 * traffic converts on a shorter form.
 */
type FieldGroupProps = {
  form: ShippingForm
  errors: FormErrors
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
}

/** Fields validated to clear step 1 of the sheet. Order matches validateForm. */
export const CONTACT_FIELDS: Array<keyof ShippingForm> = ["name", "email", "phone"]

/** Step 1 — who's claiming it. */
export function SinContactFields({ form, errors, onChange, onBlur }: FieldGroupProps) {
  return (
    <div className="space-y-3.5">
      <Field label="Name" field="name" value={form.name} error={errors.name} onChange={onChange} onBlur={onBlur} placeholder="As it appears on documents" />
      <Field label="Email" field="email" value={form.email} error={errors.email} onChange={onChange} onBlur={onBlur} placeholder="you@domain.com" type="email" />
      <Field label="Phone" field="phone" value={form.phone} error={errors.phone} onChange={onChange} onBlur={onBlur} placeholder="10-digit mobile" type="tel" />
    </div>
  )
}

/** Step 2 — where it haunts. Address + GST (folded). */
export function SinShippingFields({ form, errors, onChange, onBlur }: FieldGroupProps) {
  const [gstOpen, setGstOpen] = useState(false)
  const [pincodeLookup, setPincodeLookup] = useState<PincodeLookupState>({
    status: "idle",
    message: "",
  })
  const requestIdRef = useRef(0)
  const manualLocationVersionRef = useRef(0)
  const lookupOwnedFieldsRef = useRef({ city: false, state: false })
  const cityRef = useRef(form.city)
  const stateRef = useRef(form.state)

  cityRef.current = form.city
  stateRef.current = form.state

  const clearLookupOwnedLocation = useCallback(() => {
    if (lookupOwnedFieldsRef.current.city) {
      lookupOwnedFieldsRef.current.city = false
      onChange("city", "")
    }
    if (lookupOwnedFieldsRef.current.state) {
      lookupOwnedFieldsRef.current.state = false
      onChange("state", "")
    }
  }, [onChange])

  useEffect(() => {
    const pincode = form.pincode.trim()
    requestIdRef.current += 1

    if (pincode.length === 0) {
      clearLookupOwnedLocation()
      setPincodeLookup({ status: "idle", message: "" })
      return
    }

    if (!/^\d{6}$/.test(pincode)) {
      clearLookupOwnedLocation()
      setPincodeLookup({
        status: "idle",
        message: pincode.length >= 6 ? "Enter a valid 6-digit pincode." : "",
      })
      return
    }

    const requestId = requestIdRef.current
    const manualVersionAtStart = manualLocationVersionRef.current
    const controller = new AbortController()
    setPincodeLookup({ status: "loading", message: "Looking up city and state..." })

    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/pincode/lookup?pincode=${encodeURIComponent(pincode)}`,
          { signal: controller.signal }
        )
        const data = await res.json()
        if (controller.signal.aborted || requestId !== requestIdRef.current) return

        if (!res.ok || !data?.ok || !data.city || !data.state) {
          clearLookupOwnedLocation()
          setPincodeLookup({
            status: "error",
            message: data?.error || "Lookup failed. Enter city and state manually.",
          })
          return
        }

        const canApplyLookup = manualLocationVersionRef.current === manualVersionAtStart
        const shouldFillCity =
          canApplyLookup && (!cityRef.current.trim() || lookupOwnedFieldsRef.current.city)
        const shouldFillState =
          canApplyLookup && (!stateRef.current || lookupOwnedFieldsRef.current.state)

        if (shouldFillCity) {
          lookupOwnedFieldsRef.current.city = true
          onChange("city", String(data.city))
        }
        if (shouldFillState) {
          lookupOwnedFieldsRef.current.state = true
          onChange("state", String(data.state))
        }

        if (canApplyLookup) {
          const filledAny = shouldFillCity || shouldFillState
          setPincodeLookup({
            status: "success",
            message: filledAny
              ? "City and state checked. You can edit them if needed."
              : "Pincode found. Keeping your manual city and state.",
          })
          return
        }

        setPincodeLookup({
          status: "success",
          message: "Pincode found. Keeping your manual city and state.",
        })
      } catch {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return
        clearLookupOwnedLocation()
        setPincodeLookup({
          status: "error",
          message: "Lookup failed. Enter city and state manually.",
        })
      }
    }, 250)

    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [clearLookupOwnedLocation, form.pincode, onChange])

  const handleChange = (field: keyof ShippingForm, value: string) => {
    if (field === "pincode") {
      onChange(field, value.replace(/\D/g, "").slice(0, 6))
      return
    }

    if (field === "city" || field === "state") {
      manualLocationVersionRef.current += 1
      lookupOwnedFieldsRef.current[field] = false
    }

    onChange(field, value)
  }

  const closeGst = () => {
    setGstOpen(false)
    // Clear so a half-typed GSTIN can't block checkout from a hidden field.
    if (form.gstNumber) onChange("gstNumber", "")
    if (form.gstBusinessName) onChange("gstBusinessName", "")
  }

  return (
    <div className="space-y-3.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-blood/75">
        {SIN_BUY.shippingLabel}
      </p>

      <Field label="Address" field="address" value={form.address} error={errors.address} onChange={handleChange} onBlur={onBlur} placeholder="House, street, locality" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City" field="city" value={form.city} error={errors.city} onChange={handleChange} onBlur={onBlur} placeholder="City" />
        <div>
          <label htmlFor="rf-state" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/55">
            State
          </label>
          <div className="relative">
            <select
              id="rf-state"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
              onBlur={() => onBlur("state")}
              aria-invalid={Boolean(errors.state)}
              aria-describedby={errors.state ? "rf-state-error" : undefined}
              className={`w-full appearance-none border-2 bg-[#0d0d0d] px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider outline-none transition-colors duration-150 focus:border-blood ${
                errors.state ? "border-blood" : "border-offwhite/15"
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
            <p id="rf-state-error" role="alert" className="mt-1 font-mono text-[10px] uppercase tracking-wider text-red-400">{errors.state}</p>
          )}
        </div>
      </div>
      <Field label="Pincode" field="pincode" value={form.pincode} error={errors.pincode} onChange={handleChange} onBlur={onBlur} placeholder="6-digit" />
      {pincodeLookup.message && !errors.pincode && (
        <p
          id="rf-pincode-lookup"
          role={pincodeLookup.status === "error" ? "alert" : "status"}
          className={`-mt-2 font-mono text-[10px] uppercase tracking-wider ${
            pincodeLookup.status === "success"
              ? "text-green-400/85"
              : pincodeLookup.status === "loading"
              ? "text-bone/45"
              : "text-red-400"
          }`}
        >
          {pincodeLookup.message}
        </p>
      )}

      {/* GST — folded away by default */}
      {!gstOpen ? (
        <button
          type="button"
          onClick={() => setGstOpen(true)}
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/55 underline decoration-bone/30 underline-offset-4 transition-colors hover:text-offwhite"
        >
          {SIN_BUY.gstToggle}
        </button>
      ) : (
        <GstLookupField
          value={form.gstNumber ?? ""}
          businessName={form.gstBusinessName ?? ""}
          error={errors.gstNumber}
          onChange={onChange}
          onBlur={onBlur}
          onClose={closeGst}
        />
      )}
    </div>
  )
}

type PincodeLookupState = {
  status: "idle" | "loading" | "success" | "error"
  message: string
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
      <label htmlFor={id} className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/55">
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
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full border-2 bg-[#0d0d0d] px-4 py-3 font-mono text-sm font-bold tracking-wider text-offwhite placeholder:font-normal placeholder:text-bone/40 outline-none transition-colors duration-150 focus:border-blood ${
          error ? "border-blood" : "border-offwhite/15"
        }`}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 font-mono text-[10px] uppercase tracking-wider text-red-400">{error}</p>
      )}
    </div>
  )
}

/** GST lookup — forked from RitualForm, auto-verifies the GSTIN on blur. */
function GstLookupField({
  value,
  businessName,
  error: validationError,
  onChange,
  onBlur,
  onClose,
}: {
  value: string
  businessName: string
  error?: string
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
  onClose: () => void
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
    <div className="border-2 border-offwhite/12 bg-[#0a0a0a] px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/45">
          Business / GST invoice
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[9px] uppercase tracking-[0.24em] text-bone/45 transition-colors hover:text-offwhite"
        >
          Remove
        </button>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-bone/50">{SIN_BUY.gstHint}</p>
      <label htmlFor="rf-gstNumber" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-bone/55">
        GST Number
      </label>
      <div className="relative">
        <input
          id="rf-gstNumber"
          type="text"
          value={value}
          placeholder="22AAAAA0000A1Z5"
          autoComplete="off"
          autoFocus
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "rf-gstNumber-error" : businessName ? "rf-gstNumber-status" : undefined}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleBlur()
            }
          }}
          className={`w-full border-2 bg-[#0d0d0d] px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider text-offwhite placeholder:font-normal placeholder:text-bone/40 outline-none transition-colors duration-150 focus:border-blood ${
            error ? "border-blood" : "border-offwhite/15"
          }`}
        />
        {loading && (
          <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-bone/20 border-t-blood" />
        )}
      </div>
      {error && (
        <p id="rf-gstNumber-error" className="mt-1 font-mono text-[10px] uppercase tracking-wider text-red-400" role="alert">
          {error}
        </p>
      )}
      {businessName && !error && (
        <p id="rf-gstNumber-status" role="status" className="mt-2 border border-green-500/15 bg-green-500/[0.06] px-3 py-2 text-xs text-green-400/90">
          {businessName}
        </p>
      )}
    </div>
  )
}
