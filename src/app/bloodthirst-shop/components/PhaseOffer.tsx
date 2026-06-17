"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
import { GST_RATE, type Pack } from "@/lib/shop/catalog"
import type { ReceiptPricing } from "@/lib/shop/receipt"
import type { ShippingForm } from "@/lib/shop/types"
import { OFFER, PROOF_LEDGER } from "@/content/bloodthirst"
import { COMPANY_SUPPORT_EMAIL } from "@/lib/site/company"
import { QuantityWeapon } from "./QuantityWeapon"
import { RitualButton } from "./RitualButton"
import { RitualForm } from "./RitualForm"
import type { AppliedPromo, FormErrors } from "../hooks/useRitualCheckout"

/**
 * Phase 4 — THE OFFER.
 *
 * Three deliberate beats:
 *   1. Manifesto — full-bleed display copy, no card
 *   2. Closer — single arrogant line
 *   3. Signature — pack picker + price + form + CTA in one tight composition
 */
export function PhaseOffer({
  selected,
  onSelect,
  form,
  errors,
  onChange,
  onBlur,
  onSign,
  isSubmitting,
  payError,
  appliedPromo,
  pricing,
  onApplyPromo,
  onRemovePromo,
}: {
  selected: Pack
  onSelect: (p: Pack) => void
  form: ShippingForm
  errors: FormErrors
  onChange: (f: keyof ShippingForm, v: string) => void
  onBlur: (f: keyof ShippingForm) => void
  onSign: () => void
  isSubmitting: boolean
  payError: string | null
  appliedPromo: AppliedPromo | null
  pricing: ReceiptPricing
  onApplyPromo: (promo: AppliedPromo) => void
  onRemovePromo: () => void
}) {
  const ctaLabel = isSubmitting
    ? OFFER.ctaPending
    : `PAY ₹${pricing.total.toLocaleString("en-IN")} SECURELY`

  return (
    <section data-phase="offer" className="relative w-full">
      {/* ── BEAT 1: Manifesto, full bleed ── */}
      <div className="relative mx-auto flex min-h-[80vh] w-full max-w-6xl items-center px-6 py-24 md:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[68%] bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/78 to-transparent lg:block"
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-3xl lg:max-w-[54rem]"
        >
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-10 bg-blood/70" />
            <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood/80">
              {OFFER.eyebrow}
            </p>
          </div>

          <h2 className="max-w-[52rem] font-cinzel text-[clamp(2rem,6vw,5rem)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-offwhite">
            {OFFER.manifesto.map((line, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.1 + i * 0.12, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                {line}
              </motion.span>
            ))}
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className="mt-10 max-w-[38rem] text-base leading-relaxed text-bone/68 md:text-lg"
          >
            {OFFER.manifestoBody}
          </motion.p>

          {/* Self-aware kicker — sits below the body, smaller than the headline
              but bigger than the body. Keeps the brand bite away from the pay button. */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.65, duration: 0.8 }}
            className="mt-8 max-w-[44rem] font-cinzel text-lg font-black uppercase leading-tight tracking-[0.04em] text-blood md:text-xl"
          >
            {OFFER.manifestoKicker}
          </motion.p>
        </motion.div>
      </div>

      {/* ── BEAT 2: Closer line — sits in negative space ── */}
      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9 }}
          className="flex items-center gap-5"
        >
          <span className="h-px w-12 bg-blood/50 md:w-20" />
          <p className="font-cinzel text-base font-black uppercase tracking-[0.18em] text-blood md:text-xl">
            {OFFER.closer}
          </p>
          <span className="h-px w-12 bg-blood/50 md:w-20" />
        </motion.div>
      </div>

      {/* ── BEAT 3: Signature panel ── */}
      <div
        data-buy-panel
        className="relative mx-auto w-full max-w-5xl px-6 pb-24 pt-8 md:pb-32"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative border border-bone/15 bg-[#030303]/95 p-7 backdrop-blur-md md:p-10 lg:p-12"
          style={{
            boxShadow:
              "0 60px 120px -20px rgba(176,0,32,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Corner ticks */}
          <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-blood/80" />
          <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-blood/80" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-blood/80" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-blood/80" />

          {/* Header inside panel */}
          <div className="mb-7 flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-blood/80">
              The signature
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/35">
              500ml × {selected.qty}
            </p>
          </div>

          {/* Pack + price */}
          <div className="grid gap-7 lg:grid-cols-[1.25fr,0.9fr] lg:items-end">
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45">
                Choose your pack
              </p>
              <QuantityWeapon selected={selected} onSelect={onSelect} />
            </div>

            <div className="text-left lg:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45">
                {selected.title}
              </p>
              {appliedPromo && appliedPromo.discountAmount > 0 ? (
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 lg:justify-end">
                  <span className="font-cinzel text-2xl font-black tabular-nums text-bone/40 line-through md:text-3xl">
                    ₹{selected.price.toLocaleString("en-IN")}
                  </span>
                  <span className="font-cinzel text-5xl font-black tabular-nums leading-none text-offwhite md:text-6xl">
                    ₹{pricing.total.toLocaleString("en-IN")}
                  </span>
                </div>
              ) : (
                <p className="mt-2 font-cinzel text-5xl font-black tabular-nums leading-none text-offwhite md:text-6xl lg:text-7xl">
                  ₹{selected.price.toLocaleString("en-IN")}
                </p>
              )}
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45">
                Incl. all taxes · Free across India
              </p>
            </div>
          </div>

          <div className="my-9 h-px w-full bg-bone/12" />

          <ProofLedger />

          <div className="my-9 h-px w-full bg-bone/12" />

          {/* Form */}
          <RitualForm
            form={form}
            errors={errors}
            onChange={onChange}
            onBlur={onBlur}
          />

          <div className="my-9 h-px w-full bg-bone/12" />

          <RitualPricing
            selected={selected}
            buyerState={form.state}
            appliedPromo={appliedPromo}
            pricing={pricing}
            onApplyPromo={onApplyPromo}
            onRemovePromo={onRemovePromo}
          />

          <div className="my-9 h-px w-full bg-bone/12" />

          <AfterSign />

          <div className="my-9 h-px w-full bg-bone/12" />

          {/* CTA */}
          <div className="flex flex-col items-center gap-5">
            <RitualButton
              label={ctaLabel}
              onClick={onSign}
              pending={isSubmitting}
              disabled={isSubmitting}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/40">
              {OFFER.ctaFinePrint}
            </p>

            {payError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 max-w-md text-center"
                role="alert"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-blood">
                  {payError}
                </p>
                <Link
                  href="/contact"
                  className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-bone/50 underline decoration-bone/30 underline-offset-4 transition-colors hover:text-offwhite"
                >
                  Contact support
                </Link>
              </motion.div>
            )}

            {/* trust strip */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-bone/10 pt-5 md:gap-x-7">
              {OFFER.trust.map((t, i) => (
                <span
                  key={t}
                  className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.4em] text-bone/45"
                >
                  {i > 0 && <span className="hidden h-px w-3 bg-bone/20 md:inline-block" />}
                  {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ProofLedger() {
  return (
    <div className="grid gap-6 md:grid-cols-[0.9fr,1.1fr] md:items-start">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood/70">
          {PROOF_LEDGER.eyebrow}
        </p>
        <h3 className="mt-3 font-cinzel text-2xl font-black uppercase leading-tight text-offwhite md:text-3xl">
          {PROOF_LEDGER.title}
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-bone/58">
          {PROOF_LEDGER.body}
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid gap-px overflow-hidden border border-bone/12 bg-bone/12 sm:grid-cols-2">
          {PROOF_LEDGER.facts.map((fact) => (
            <div key={fact.label} className="bg-black/70 px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-bone/38">
                {fact.label}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-bone/75">
                {fact.value}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-bone/35">
          Water test snapshot and mineral details live in{" "}
          <Link
            href="/faq"
            className="text-bone/55 underline decoration-bone/25 underline-offset-4 transition-colors hover:text-offwhite"
          >
            FAQ
          </Link>
          . The checkout stays for choosing, paying, and getting the cans moving.
        </p>
      </div>
    </div>
  )
}

function AfterSign() {
  return (
    <div className="border border-bone/10 bg-black/45 px-4 py-4 md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blood/70">
            What happens when you pay
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-bone/58">
            {PROOF_LEDGER.afterSign.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blood/80" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-bone/40">
            Support:{" "}
            <Link href={`mailto:${COMPANY_SUPPORT_EMAIL}`} className="text-bone/65 underline decoration-bone/25 underline-offset-4 transition-colors hover:text-offwhite">
              {COMPANY_SUPPORT_EMAIL}
            </Link>
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-3 gap-px border border-bone/10 bg-bone/10 md:w-72">
          {["prepaid only", "gst invoice", "no hidden fee"].map((item) => (
            <span
              key={item}
              className="bg-black/70 px-3 py-3 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.24em] text-bone/52"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const SUPPLIER_STATE = "Uttar Pradesh"

function RitualPricing({
  selected,
  buyerState,
  appliedPromo,
  pricing,
  onApplyPromo,
  onRemovePromo,
}: {
  selected: Pack
  buyerState: string
  appliedPromo: AppliedPromo | null
  pricing: ReceiptPricing
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

  return (
    <div className="grid gap-6 md:grid-cols-[1fr,1fr] md:items-start">
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45">
          Promo code
        </p>
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
            <p className="mt-2 text-[10px] tracking-[0.22em]">
              Saves INR {appliedPromo.discountAmount.toLocaleString("en-IN")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase())
                  setPromoError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyPromo()
                }}
                placeholder="Promo code"
                className="min-w-0 flex-1 border border-bone/15 bg-black/60 px-4 py-3 font-mono text-sm uppercase tracking-wider text-offwhite placeholder:text-bone/25 outline-none transition-colors focus:border-blood/70"
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
          </>
        )}
      </div>

      <div className="border border-bone/10 bg-black/35 px-4 py-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45">
          Payment summary
        </p>
        <div className="space-y-2 font-mono text-[11px] uppercase tracking-[0.18em] text-bone/55">
          <PriceRow
            label={`${selected.title} (${selected.qty} cans)`}
            value={`INR ${selected.price.toLocaleString("en-IN")}`}
          />
          {appliedPromo && (
            <PriceRow
              label={`Discount ${appliedPromo.code}`}
              value={`-INR ${appliedPromo.discountAmount.toLocaleString("en-IN")}`}
              accent
            />
          )}
          <PriceRow label="Shipping" value="Free" accent />
        </div>
        <div className="mt-4 border-t border-bone/10 pt-4">
          <div className="flex items-end justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/45">
              Total (incl. GST)
            </span>
            <span className="font-cinzel text-3xl font-black tabular-nums text-offwhite">
              INR {pricing.total.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="mt-1.5 text-right font-mono text-[10px] text-bone/40">
            {!buyerState && `Tax (${GST_RATE * 100}%) — determined by state`}
            {buyerState && buyerState === SUPPLIER_STATE && `Includes CGST ${(GST_RATE * 100) / 2}% + SGST ${(GST_RATE * 100) / 2}% · INR ${formatTaxAmount(pricing.gstAmount)}`}
            {buyerState && buyerState !== SUPPLIER_STATE && `Includes IGST ${GST_RATE * 100}% · INR ${formatTaxAmount(pricing.gstAmount)}`}
          </div>
        </div>
      </div>
    </div>
  )
}

function PriceRow({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span>{label}</span>
      <span className={`text-right tabular-nums ${accent ? "text-green-400" : "text-offwhite/80"}`}>
        {value}
      </span>
    </div>
  )
}

function formatTaxAmount(amount: number) {
  const hasFraction = !Number.isInteger(amount)
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })
}
