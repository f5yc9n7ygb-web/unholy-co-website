"use client"

import { CHECKOUT_ADD_ON_CONFIG, NOTE_TONES, type NoteTone } from "@/lib/shop/addon-config"
import { SIN_ADDON } from "@/content/sin"

/**
 * Cursed Note add-on — the single piece of theater allowed onto the spine.
 * Rendered COLLAPSED inside checkout step 2: an optional ₹99 order-bump that can
 * never block or distract from the pay action. Title + price + tones come from
 * the shared CHECKOUT_ADD_ON_CONFIG so /sin can't drift from the real product;
 * the seduction copy is SIN_ADDON. Reuses the same draft state the rest of the
 * site's checkout uses (threaded from useCheckoutAddOnDraft in SinClient).
 */
const NOTE = CHECKOUT_ADD_ON_CONFIG.cursed_note

export function SinCursedNote({
  enabled,
  onToggle,
  tone,
  onToneChange,
  recipientName,
  onRecipientChange,
  context,
  onContextChange,
}: {
  enabled: boolean
  onToggle: (next: boolean) => void
  tone: NoteTone
  onToneChange: (tone: NoteTone) => void
  recipientName: string
  onRecipientChange: (value: string) => void
  context: string
  onContextChange: (value: string) => void
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
            {SIN_ADDON.kicker}
          </p>
          <h4 className="mt-1 font-anton text-lg uppercase leading-none tracking-[0.04em] text-offwhite md:text-xl">
            {SIN_ADDON.title}
            <span className="ml-2 align-middle font-mono text-[10px] tracking-[0.18em] text-bone/45">
              +₹{NOTE.price}
            </span>
          </h4>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-bone/55">
            {SIN_ADDON.blurb}
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
          {enabled ? SIN_ADDON.addedLabel : SIN_ADDON.addLabel}
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 border-t-2 border-offwhite/12 p-4 md:p-5">
          <div>
            <FieldLabel>{SIN_ADDON.toneLabel}</FieldLabel>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={SIN_ADDON.toneLabel}>
              {NOTE_TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={tone === t}
                  onClick={() => onToneChange(t)}
                  className={`border-2 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                    tone === t
                      ? "border-blood bg-blood text-offwhite"
                      : "border-offwhite/15 text-bone/60 hover:border-offwhite/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <FieldLabel>{SIN_ADDON.recipientLabel}</FieldLabel>
            <input
              value={recipientName}
              onChange={(e) => onRecipientChange(e.target.value)}
              placeholder={SIN_ADDON.recipientPlaceholder}
              className="mt-1.5 w-full border-2 border-offwhite/15 bg-[#0d0d0d] px-4 py-3 font-mono text-sm tracking-wider text-offwhite placeholder:text-bone/40 outline-none transition-colors focus:border-blood"
            />
          </label>

          <label className="block">
            <FieldLabel>{SIN_ADDON.contextLabel}</FieldLabel>
            <textarea
              value={context}
              onChange={(e) => onContextChange(e.target.value)}
              placeholder={SIN_ADDON.contextPlaceholder}
              rows={3}
              className="mt-1.5 w-full resize-none border-2 border-offwhite/15 bg-[#0d0d0d] px-4 py-3 text-sm leading-relaxed text-offwhite placeholder:text-bone/40 outline-none transition-colors focus:border-blood"
            />
          </label>
        </div>
      )}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone/55">{children}</p>
  )
}
