"use client"

import { CHECKOUT_ADD_ON_CONFIG } from "@/lib/shop/addon-config"
import { SIN_LEDGER_ADDON } from "@/content/sin"

/**
 * Unholy Ledger add-on — the second optional add-on in checkout step 2 (below
 * the Cursed Note). Publishes name/city/confession to a public record, so it
 * carries a CONSENT checkbox: the draft hook only counts it toward the order
 * when `ledgerConsent` is true, and we surface that explicitly. Price/consent
 * label come from the shared CHECKOUT_ADD_ON_CONFIG.
 */
const LEDGER = CHECKOUT_ADD_ON_CONFIG.unholy_ledger
const CONSENT_LABEL =
  LEDGER.fields.find((f) => f.key === "consent")?.label ??
  "I consent to my entry being published publicly."

export function SinLedger({
  enabled,
  onToggle,
  name,
  onNameChange,
  city,
  onCityChange,
  confession,
  onConfessionChange,
  consent,
  onConsentChange,
}: {
  enabled: boolean
  onToggle: (next: boolean) => void
  name: string
  onNameChange: (v: string) => void
  city: string
  onCityChange: (v: string) => void
  confession: string
  onConfessionChange: (v: string) => void
  consent: boolean
  onConsentChange: (v: boolean) => void
}) {
  return (
    <div
      className={`border-2 transition-colors duration-300 ${
        enabled ? "border-blood bg-blood/[0.07]" : "border-offwhite/12 bg-[#0a0a0a]"
      }`}
    >
      <div className="flex items-center justify-between gap-4 p-4 md:p-5">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-blood/80">
            {SIN_LEDGER_ADDON.kicker}
          </p>
          <h4 className="mt-1 font-anton text-lg uppercase leading-none tracking-[0.04em] text-offwhite md:text-xl">
            {SIN_LEDGER_ADDON.title}
            <span className="ml-2 align-middle font-mono text-[10px] tracking-[0.18em] text-bone/45">
              +₹{LEDGER.price}
            </span>
          </h4>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-bone/55">
            {SIN_LEDGER_ADDON.blurb}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          aria-pressed={enabled}
          className={`shrink-0 border-2 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] transition-colors ${
            enabled
              ? "border-offwhite bg-blood text-offwhite shadow-[3px_3px_0_#F6F6F6]"
              : "border-offwhite/25 text-bone/70 hover:border-blood hover:text-blood"
          }`}
        >
          {enabled ? SIN_LEDGER_ADDON.addedLabel : SIN_LEDGER_ADDON.addLabel}
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 border-t-2 border-offwhite/12 p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>{SIN_LEDGER_ADDON.nameLabel}</FieldLabel>
              <input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={SIN_LEDGER_ADDON.namePlaceholder}
                className={inputClass}
              />
            </label>
            <label className="block">
              <FieldLabel>{SIN_LEDGER_ADDON.cityLabel}</FieldLabel>
              <input
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder={SIN_LEDGER_ADDON.cityPlaceholder}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block">
            <FieldLabel>{SIN_LEDGER_ADDON.confessionLabel}</FieldLabel>
            <textarea
              value={confession}
              onChange={(e) => onConfessionChange(e.target.value)}
              placeholder={SIN_LEDGER_ADDON.confessionPlaceholder}
              rows={2}
              className={`resize-none ${inputClass}`}
            />
          </label>

          <label className="flex cursor-pointer gap-3 border-2 border-offwhite/15 bg-[#0d0d0d] p-3.5 text-xs leading-relaxed text-bone/65">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-blood"
            />
            <span>{CONSENT_LABEL}</span>
          </label>
          {!consent && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blood/85" role="status">
              Not added until you consent to publication.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const inputClass =
  "mt-1.5 w-full border-2 border-offwhite/15 bg-[#0d0d0d] px-4 py-3 font-mono text-sm tracking-wider text-offwhite placeholder:text-bone/40 outline-none transition-colors focus:border-blood"

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone/55">{children}</p>
  )
}
