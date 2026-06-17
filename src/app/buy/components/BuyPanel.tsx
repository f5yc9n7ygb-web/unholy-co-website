"use client"

import Link from "next/link"
import { useState } from "react"
import { GST_RATE, type Pack } from "@/lib/shop/catalog"
import type { ReceiptPricing } from "@/lib/shop/receipt"
import type { ShippingForm } from "@/lib/shop/types"
import { QuantityWeapon } from "@/app/bloodthirst-shop/components/QuantityWeapon"
import { RitualButton } from "@/app/bloodthirst-shop/components/RitualButton"
import { RitualForm } from "@/app/bloodthirst-shop/components/RitualForm"
import type { AppliedPromo, FormErrors } from "@/app/bloodthirst-shop/hooks/useRitualCheckout"
import { BUY_PANEL } from "@/content/bloodthirst-buy"
import { SectionHead, Stamp } from "./DocBits"

/**
 * Section 02 — acquisition. The purchase block as the file's official form.
 *
 * Order mirrors the buyer's mental flow: pick pack → see price → shipping →
 * (optional promo, folded away) → confirm total → pay. Everything persuasive
 * lives OUTSIDE this panel; in here it's pure transaction.
 */
export function BuyPanel({
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
    ? BUY_PANEL.ctaPending
    : `PAY ₹${pricing.total.toLocaleString("en-IN")} SECURELY`

  return (
    <section
      id="bt-buy"
      data-buy-panel
      // scroll-mt clears the fixed slim header when jumped to
      className="relative mx-auto w-full max-w-5xl scroll-mt-16 px-5 pb-20 pt-4 md:px-10 md:pb-28"
    >
      <SectionHead no={BUY_PANEL.section} title={BUY_PANEL.title} />

      <div className="relative border border-bone/25 bg-[#0c0c0c]">
        {/* form header bar */}
        <div className="relative flex items-baseline justify-between gap-4 border-b border-bone/25 px-5 py-3 md:px-8">
          <p className="font-cinzel text-base font-black uppercase tracking-[0.04em] text-offwhite md:text-lg">
            {BUY_PANEL.subtitle}
          </p>
          <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/55">
            500ml × {selected.qty}
          </p>
          <div className="absolute -right-2 -top-5 md:-right-4">
            <Stamp rotate={7}>FORM BT-001</Stamp>
          </div>
        </div>

        <div className="p-5 md:p-8">
          <QuantityWeapon selected={selected} onSelect={onSelect} />

          {/* Price readout — updates with pack + promo */}
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-bone/55">
              {selected.title} · ₹{selected.perCan}/can
            </p>
            <div className="flex items-baseline gap-3">
              {appliedPromo && appliedPromo.discountAmount > 0 && (
                <span className="font-cinzel text-lg font-black tabular-nums text-bone/40 line-through">
                  ₹{selected.price.toLocaleString("en-IN")}
                </span>
              )}
              <span className="font-cinzel text-4xl font-black tabular-nums leading-none text-offwhite md:text-5xl">
                ₹{pricing.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-right font-mono text-[9px] uppercase tracking-[0.26em] text-bone/55">
            {BUY_PANEL.priceNote}
          </p>

          <div className="my-7 h-px w-full bg-bone/15" />

          <RitualForm form={form} errors={errors} onChange={onChange} onBlur={onBlur} />

          <div className="my-7 h-px w-full bg-bone/15" />

          <PromoAndSummary
            selected={selected}
            appliedPromo={appliedPromo}
            pricing={pricing}
            onApplyPromo={onApplyPromo}
            onRemovePromo={onRemovePromo}
          />

          <div className="my-7 h-px w-full bg-bone/15" />

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <RitualButton
              label={ctaLabel}
              onClick={onSign}
              pending={isSubmitting}
              disabled={isSubmitting}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-bone/55">
              {BUY_PANEL.ctaFinePrint}
            </p>

            {payError && (
              <div className="max-w-md text-center" role="alert">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-blood">
                  {payError}
                </p>
                <Link
                  href="/contact"
                  className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.28em] text-bone/55 underline decoration-bone/30 underline-offset-4 transition-colors hover:text-offwhite"
                >
                  Contact support
                </Link>
              </div>
            )}

            {/* what happens after you pay — hesitation killer next to the button */}
            <ul className="mt-2 w-full max-w-xl space-y-2 border-t border-dashed border-bone/20 px-1 pt-4 text-sm leading-relaxed text-bone/62">
              {BUY_PANEL.afterPay.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blood/80" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {BUY_PANEL.trust.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[9px] uppercase tracking-[0.35em] text-bone/55"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Promo (folded behind a toggle — minority path) + payment summary ─── */
function PromoAndSummary({
  selected,
  appliedPromo,
  pricing,
  onApplyPromo,
  onRemovePromo,
}: {
  selected: Pack
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
      {/* Ledger-style summary with dotted leaders */}
      <div>
        <div className="space-y-2 font-mono text-[11px] uppercase tracking-[0.18em] text-bone/62">
          <LedgerRow
            label={`${selected.title} (${selected.qty} cans)`}
            value={`₹${selected.price.toLocaleString("en-IN")}`}
          />
          {appliedPromo && (
            <LedgerRow
              label={`Discount ${appliedPromo.code}`}
              value={`-₹${appliedPromo.discountAmount.toLocaleString("en-IN")}`}
              accent
            />
          )}
          <LedgerRow label="Shipping" value="Free" accent />
        </div>
        <div className="mt-4 flex items-end justify-between gap-4 border-t border-bone/20 pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/55">
            Total (incl. GST)
          </span>
          <span className="font-cinzel text-2xl font-black tabular-nums text-offwhite">
            ₹{pricing.total.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="mt-1.5 text-right font-mono text-[10px] text-bone/50">
          Includes {GST_RATE * 100}% GST · ₹
          {pricing.gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Promo — folded away; most buyers don't have a code */}
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
          {BUY_PANEL.promoToggle}
        </button>
      ) : (
        <div>
          <div className="flex max-w-sm gap-2">
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
        </div>
      )}
    </div>
  )
}

/** Ledger row — dotted leader between label and value, like an old invoice */
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
      <span
        aria-hidden
        className="mb-1 min-w-4 flex-1 border-b border-dotted border-bone/30"
      />
      <span className={`shrink-0 tabular-nums ${accent ? "text-green-400" : "text-offwhite/80"}`}>
        {value}
      </span>
    </div>
  )
}
