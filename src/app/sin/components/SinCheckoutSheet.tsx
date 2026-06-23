"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { GST_RATE, type Pack } from "@/lib/shop/catalog"
import type { ReceiptPricing } from "@/lib/shop/receipt"
import type { ShippingForm } from "@/lib/shop/types"
import {
  validateForm,
  type AppliedPromo,
  type CheckoutAddOn,
  type CheckoutErrorKind,
  type FormErrors,
} from "@/app/bloodthirst-shop/hooks/useRitualCheckout"
import type { NoteTone } from "@/lib/shop/addon-config"
import { SIN_BUY } from "@/content/sin"
import { CONTACT_FIELDS, SinContactFields, SinShippingFields } from "./SinForm"
import { SinCursedNote } from "./SinCursedNote"
import { SinDispatch } from "./SinDispatch"

/**
 * Focused checkout sheet — the headline functional change of the overhaul. The
 * on-page panel now only picks a pack; the shipping form lives here, in a
 * slide-up sheet (mobile) / centred modal (desktop) that opens on intent. Two
 * steps — contact → shipping + pay — so a stranger from a cold ad never faces a
 * full form until they've committed.
 *
 * Reuses useRitualCheckout end-to-end (props threaded from SinClient). Step 1 is
 * gated with the SAME validateForm the hook's sign() uses, so by the time pay
 * runs on step 2 only step-2 fields can be invalid — and those are mounted, so
 * the hook's focus-jump-on-error still resolves every field.
 */
type Props = {
  open: boolean
  onClose: () => void
  selected: Pack
  form: ShippingForm
  errors: FormErrors
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
  pricing: ReceiptPricing
  appliedPromo: AppliedPromo | null
  onApplyPromo: (promo: AppliedPromo) => void
  onRemovePromo: () => void
  onPay: () => void
  isSubmitting: boolean
  connecting: boolean
  rzError: boolean
  payError: string | null
  payErrorKind: CheckoutErrorKind | null
  // Cursed Note add-on (the one bit of theater on the spine)
  addOns: CheckoutAddOn[]
  noteEnabled: boolean
  onNoteToggle: (next: boolean) => void
  noteTone: NoteTone
  onNoteToneChange: (tone: NoteTone) => void
  recipientName: string
  onRecipientChange: (value: string) => void
  noteContext: string
  onNoteContextChange: (value: string) => void
}

export function SinCheckoutSheet(props: Props) {
  const { open, onClose } = props
  return (
    <AnimatePresence>
      {open && <SheetBody key="sheet" {...props} />}
    </AnimatePresence>
  )
}

function SheetBody({
  onClose,
  selected,
  form,
  errors,
  onChange,
  onBlur,
  pricing,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
  onPay,
  isSubmitting,
  connecting,
  rzError,
  payError,
  payErrorKind,
  addOns,
  noteEnabled,
  onNoteToggle,
  noteTone,
  onNoteToneChange,
  recipientName,
  onRecipientChange,
  noteContext,
  onNoteContextChange,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const total = pricing.total.toLocaleString("en-IN")

  // Focus trap + Escape, scoped to the panel.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key !== "Tab") return
      const f = focusables()
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    panel.addEventListener("keydown", onKey)
    return () => panel.removeEventListener("keydown", onKey)
  }, [onClose])

  // Move focus on step change. On the initial step (1) focus the dialog itself
  // rather than an input, so opening the sheet on mobile doesn't immediately
  // pop the keyboard; once the user commits to step 2 we focus the first field.
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      if (step === 2) {
        bodyRef.current?.querySelector<HTMLElement>("input, select")?.focus({ preventScroll: true })
      } else {
        panelRef.current?.focus({ preventScroll: true })
      }
      bodyRef.current?.scrollTo({ top: 0 })
    })
    return () => cancelAnimationFrame(t)
  }, [step])

  // Step 1 → 2: gate on the contact subset using the hook's own validator.
  const continueToShipping = () => {
    CONTACT_FIELDS.forEach(onBlur)
    const errs = validateForm(form)
    const blocking = CONTACT_FIELDS.find((f) => errs[f])
    if (blocking) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`rf-${blocking}`)
        el?.scrollIntoView({ block: "center", behavior: "smooth" })
        el?.focus({ preventScroll: true })
      })
      return
    }
    setStep(2)
  }

  const ctaLabel = isSubmitting
    ? SIN_BUY.ctaPending
    : connecting
    ? SIN_BUY.ctaConnecting
    : rzError
    ? SIN_BUY.ctaRetry
    : `PAY ₹${total} SECURELY`
  const ctaBusy = isSubmitting || connecting

  return (
    <>
      <motion.div
        aria-hidden
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Secure checkout"
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-[75] flex max-h-[94dvh] flex-col border-t border-bone/15 bg-[#0a0a0a] md:inset-0 md:m-auto md:h-fit md:max-h-[88vh] md:max-w-lg md:border"
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 48 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Header: pack + total + close ── */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-bone/12 px-5 py-4 md:px-7">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/45">
              {selected.title} · {selected.qty} cans · ₹{selected.perCan}/can
            </p>
            <p className="mt-1 font-cinzel text-2xl font-black tabular-nums leading-none text-offwhite">
              ₹{total}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 font-mono text-[9px] uppercase tracking-[0.28em] text-bone/45 underline decoration-bone/25 underline-offset-4 transition-colors hover:text-offwhite"
            >
              ← change pack
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="shrink-0 border border-bone/15 px-3 py-2 font-mono text-xs text-bone/60 transition-colors hover:border-blood/60 hover:text-blood"
          >
            ✕
          </button>
        </header>

        {/* ── Step indicator ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-bone/12 px-5 py-3 md:px-7">
          <StepDot n={1} label="Contact" active={step === 1} done={step > 1} onClick={() => setStep(1)} />
          <span aria-hidden className="h-px flex-1 bg-bone/12" />
          <StepDot n={2} label="Ship & pay" active={step === 2} done={false} />
        </div>

        {/* ── Body ── */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
          {step === 1 ? (
            <div className="space-y-5">
              <SinContactFields form={form} errors={errors} onChange={onChange} onBlur={onBlur} />
              <button
                type="button"
                onClick={continueToShipping}
                className="group inline-flex w-full items-center justify-center gap-3 border border-blood bg-blood px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-offwhite transition-colors duration-300 hover:bg-[#c4072a]"
              >
                Continue to shipping
                <span aria-hidden className="inline-block h-px w-5 bg-offwhite/70 transition-all duration-300 group-hover:w-9" />
              </button>
              <p className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-bone/45">
                {SIN_BUY.ctaFinePrint}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <SinShippingFields form={form} errors={errors} onChange={onChange} onBlur={onBlur} />

              <SinCursedNote
                enabled={noteEnabled}
                onToggle={onNoteToggle}
                tone={noteTone}
                onToneChange={onNoteToneChange}
                recipientName={recipientName}
                onRecipientChange={onRecipientChange}
                context={noteContext}
                onContextChange={onNoteContextChange}
              />

              <div className="h-px w-full bg-gradient-to-r from-blood/50 via-bone/15 to-transparent" />

              <PromoAndSummary
                selected={selected}
                addOns={addOns}
                appliedPromo={appliedPromo}
                pricing={pricing}
                onApplyPromo={onApplyPromo}
                onRemovePromo={onRemovePromo}
              />

              <button
                type="button"
                onClick={onPay}
                disabled={isSubmitting}
                aria-busy={ctaBusy}
                className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden border border-blood bg-blood px-8 py-5 text-center font-mono text-xs font-bold uppercase tracking-[0.28em] text-offwhite shadow-[0_22px_70px_-14px_rgba(176,0,32,0.75)] transition-colors duration-300 hover:bg-[#c4072a] disabled:cursor-not-allowed disabled:opacity-70 md:text-sm md:tracking-[0.32em]"
              >
                {ctaBusy && (
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-offwhite" />
                )}
                <span>{ctaLabel}</span>
                {!ctaBusy && (
                  <span aria-hidden className="inline-block h-px w-5 bg-offwhite/70 transition-all duration-300 group-hover:w-9" />
                )}
              </button>

              {payError && (
                <div className="text-center" role="alert">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-blood">
                    {payError}
                  </p>
                  {payErrorKind !== "validation" && (
                    <Link
                      href="/contact"
                      className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-bone/55 underline decoration-bone/30 underline-offset-4 transition-colors hover:text-offwhite"
                    >
                      Contact support
                    </Link>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono text-[9px] uppercase tracking-[0.26em] text-bone/45">
                <SinDispatch compact />
                {SIN_BUY.trust.map((t) => (
                  <span key={t} className="inline-flex items-center gap-3 whitespace-nowrap">
                    <span aria-hidden className="text-blood/45">/</span>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

function StepDot({
  n,
  label,
  active,
  done,
  onClick,
}: {
  n: number
  label: string
  active: boolean
  done: boolean
  onClick?: () => void
}) {
  const Tag = onClick ? "button" : "span"
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className="inline-flex items-center gap-2"
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center border font-mono text-[10px] ${
          active
            ? "border-blood bg-blood text-offwhite"
            : done
            ? "border-blood/50 text-blood"
            : "border-bone/20 text-bone/45"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <span
        className={`font-mono text-[9px] uppercase tracking-[0.28em] ${
          active ? "text-offwhite/85" : "text-bone/45"
        }`}
      >
        {label}
      </span>
    </Tag>
  )
}

/* ── Promo (folded — minority path) + payment summary ── */
function PromoAndSummary({
  selected,
  addOns,
  appliedPromo,
  pricing,
  onApplyPromo,
  onRemovePromo,
}: {
  selected: Pack
  addOns: CheckoutAddOn[]
  appliedPromo: AppliedPromo | null
  pricing: ReceiptPricing
  onApplyPromo: (promo: AppliedPromo) => void
  onRemovePromo: () => void
}) {
  const [promoOpen, setPromoOpen] = useState(false)
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

  return (
    <div className="space-y-5">
      <div>
        <div className="space-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/60">
          <LedgerRow
            label={`${selected.title} (${selected.qty} cans)`}
            value={`₹${selected.price.toLocaleString("en-IN")}`}
          />
          {addOns.map((addOn) => (
            <LedgerRow
              key={addOn.id}
              label={addOn.title}
              value={`+₹${addOn.price.toLocaleString("en-IN")}`}
            />
          ))}
          {appliedPromo && (
            <LedgerRow
              label={`Discount ${appliedPromo.code}`}
              value={`-₹${appliedPromo.discountAmount.toLocaleString("en-IN")}`}
              accent
            />
          )}
          <LedgerRow label="Shipping" value="Free" accent />
        </div>
        <div className="mt-4 flex items-end justify-between gap-4 border-t border-bone/15 pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/50">
            Total (incl. GST)
          </span>
          <span className="font-cinzel text-2xl font-black tabular-nums text-offwhite">
            ₹{pricing.total.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="mt-1.5 text-right font-mono text-[10px] text-bone/45">
          Includes {GST_RATE * 100}% GST · ₹
          {pricing.gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </p>
      </div>

      {appliedPromo ? (
        <div className="border border-green-500/20 bg-green-500/[0.06] px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-green-400">
          <div className="flex items-center justify-between gap-3">
            <span>{appliedPromo.code} applied</span>
            <button
              type="button"
              onClick={onRemovePromo}
              className="text-[10px] text-bone/55 transition-colors hover:text-offwhite"
            >
              Remove
            </button>
          </div>
        </div>
      ) : !promoOpen ? (
        <button
          type="button"
          onClick={() => setPromoOpen(true)}
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/55 underline decoration-bone/30 underline-offset-4 transition-colors hover:text-offwhite"
        >
          {SIN_BUY.promoToggle}
        </button>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              autoFocus
              onChange={(e) => {
                setPromoInput(e.target.value.toUpperCase())
                setPromoError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyPromo()
              }}
              placeholder="Promo code"
              className="min-w-0 flex-1 border border-bone/12 bg-black/55 px-4 py-3 font-mono text-sm uppercase tracking-wider text-offwhite placeholder:text-bone/30 outline-none transition-colors focus:border-blood/70"
            />
            <button
              type="button"
              onClick={applyPromo}
              disabled={promoLoading || !promoInput.trim()}
              className="min-w-[5.5rem] border border-blood/40 bg-blood/10 px-4 font-mono text-[10px] uppercase tracking-[0.3em] text-blood transition-colors hover:bg-blood/20 disabled:opacity-40"
            >
              {promoLoading ? "..." : "Apply"}
            </button>
          </div>
          {promoError && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-blood" role="alert">
              {promoError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Ledger row — dotted leader between label and value, like an old invoice. */
function LedgerRow({
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
