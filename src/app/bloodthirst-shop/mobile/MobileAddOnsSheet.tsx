"use client"

import { BadgeCheck, Gift, X } from "lucide-react"
import type React from "react"
import { useEffect, useRef } from "react"
import { CHECKOUT_ADD_ON_CONFIG, NOTE_TONES, type NoteTone } from "@/lib/shop/addon-config"

type MobileAddOnsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteEnabled: boolean
  onNoteEnabledChange: (enabled: boolean) => void
  noteTone: NoteTone
  onNoteToneChange: (tone: NoteTone) => void
  recipientName: string
  onRecipientNameChange: (value: string) => void
  noteContext: string
  onNoteContextChange: (value: string) => void
  ledgerEnabled: boolean
  onLedgerEnabledChange: (enabled: boolean) => void
  ledgerName: string
  onLedgerNameChange: (value: string) => void
  ledgerCity: string
  onLedgerCityChange: (value: string) => void
  ledgerConfession: string
  onLedgerConfessionChange: (value: string) => void
  ledgerConsent: boolean
  onLedgerConsentChange: (checked: boolean) => void
  onEngage?: () => void
}

export function MobileAddOnsSheet({
  open,
  onOpenChange,
  noteEnabled,
  onNoteEnabledChange,
  noteTone,
  onNoteToneChange,
  recipientName,
  onRecipientNameChange,
  noteContext,
  onNoteContextChange,
  ledgerEnabled,
  onLedgerEnabledChange,
  ledgerName,
  onLedgerNameChange,
  ledgerCity,
  onLedgerCityChange,
  ledgerConfession,
  onLedgerConfessionChange,
  ledgerConsent,
  onLedgerConsentChange,
  onEngage,
}: MobileAddOnsSheetProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const note = CHECKOUT_ADD_ON_CONFIG.cursed_note
  const ledger = CHECKOUT_ADD_ON_CONFIG.unholy_ledger
  const enabledCount = Number(noteEnabled) + Number(ledgerEnabled && ledgerConsent)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const trigger = triggerRef.current
    document.body.style.overflow = "hidden"
    const sheet = sheetRef.current
    const focusable = () => Array.from(sheet?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || [])
    requestAnimationFrame(() => focusable()[0]?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onOpenChange(false)
        return
      }
      if (event.key !== "Tab") return
      const items = focusable()
      if (!items.length) return
      const first = items[0]!
      const last = items[items.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [onOpenChange, open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-add-ons-sheet"
        onClick={() => {
          onEngage?.()
          onOpenChange(true)
        }}
        className="flex w-full items-center justify-between gap-4 border border-bone/15 bg-black/45 px-4 py-4 text-left active:scale-[0.99]"
      >
        <span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.28em] text-blood/80">
            Personalize
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-bone/62">
            Cursed Note, Ledger entry, or leave the water innocent.
          </span>
        </span>
        <span className="shrink-0 font-cinzel text-2xl font-black text-offwhite">
          {enabledCount}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80]" onPointerDown={onEngage}>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/70"
            onClick={() => onOpenChange(false)}
          />
          <div
            ref={sheetRef}
            id="mobile-add-ons-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-add-ons-title"
            className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto border-t border-bone/15 bg-[#090909] px-4 pb-5 pt-3 shadow-[0_-30px_80px_rgba(0,0,0,0.7)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-bone/20" aria-hidden />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-blood/80">
                  Add-ons
                </p>
                <h3 id="mobile-add-ons-title" className="font-cinzel text-2xl font-black uppercase text-offwhite">
                  Make It Worse
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close add-ons"
                onClick={() => onOpenChange(false)}
                className="flex h-10 w-10 items-center justify-center border border-bone/15 text-bone/70 active:scale-[0.96]"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <section className="border border-bone/12 bg-black/35 p-4">
                <AddOnHeader
                  icon={<Gift size={17} />}
                  title={note.title}
                  price={note.price}
                  enabled={noteEnabled}
                  onToggle={() => onNoteEnabledChange(!noteEnabled)}
                />
                {noteEnabled && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <FieldLabel>Choose note type</FieldLabel>
                      <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Note tone">
                        {NOTE_TONES.map((tone) => (
                          <button
                            key={tone}
                            type="button"
                            role="radio"
                            aria-checked={noteTone === tone}
                            onClick={() => onNoteToneChange(tone)}
                            className={`border px-3 py-2 text-left text-xs transition-colors active:scale-[0.98] ${
                              noteTone === tone
                                ? "border-blood bg-blood/18 text-offwhite"
                                : "border-bone/12 text-bone/62"
                            }`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>
                    <TextInput
                      label="Recipient name"
                      value={recipientName}
                      onChange={onRecipientNameChange}
                      placeholder="Name of the sinner receiving this"
                    />
                    <TextArea
                      label="Extra context"
                      value={noteContext}
                      onChange={onNoteContextChange}
                      placeholder="Tell us just enough to make it personal."
                    />
                  </div>
                )}
              </section>

              <section className="border border-bone/12 bg-black/35 p-4">
                <AddOnHeader
                  icon={<BadgeCheck size={17} />}
                  title={ledger.title}
                  price={ledger.price}
                  enabled={ledgerEnabled}
                  onToggle={() => onLedgerEnabledChange(!ledgerEnabled)}
                />
                {ledgerEnabled && (
                  <div className="mt-4 space-y-4">
                    <TextInput
                      label="Display name or Instagram handle"
                      value={ledgerName}
                      onChange={onLedgerNameChange}
                      placeholder="@unholy_sinner"
                    />
                    <TextInput
                      label="City"
                      value={ledgerCity}
                      onChange={onLedgerCityChange}
                      placeholder="Jaipur"
                    />
                    <TextArea
                      label="Optional confession"
                      value={ledgerConfession}
                      onChange={onLedgerConfessionChange}
                      placeholder="I said I was just curious. I lied."
                    />
                    <label className="flex gap-3 border border-bone/12 bg-black/45 p-4 text-sm leading-relaxed text-bone/66">
                      <input
                        type="checkbox"
                        checked={ledgerConsent}
                        onChange={(event) => onLedgerConsentChange(event.target.checked)}
                        className="mt-1 h-4 w-4 accent-blood"
                      />
                      <span>{ledger.fields.find((field) => field.key === "consent")?.label}</span>
                    </label>
                    {!ledgerConsent && (
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blood">
                        Ledger entry is not added until consent is checked.
                      </p>
                    )}
                  </div>
                )}
              </section>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-5 w-full bg-offwhite px-5 py-4 text-sm font-black uppercase text-black active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function AddOnHeader({
  icon,
  title,
  price,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode
  title: string
  price: number
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-bone/15 text-blood">
          {icon}
        </span>
        <div className="min-w-0">
          <h4 className="truncate font-cinzel text-lg font-black uppercase text-offwhite">
            {title}
          </h4>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-bone/45">
            +₹{price}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={`shrink-0 border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] active:scale-[0.97] ${
          enabled
            ? "border-blood bg-blood text-offwhite"
            : "border-bone/15 text-bone/65"
        }`}
      >
        {enabled ? "Added" : "Add"}
      </button>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone/45">
      {children}
    </p>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border border-bone/15 bg-black/60 px-4 py-3 text-sm text-offwhite outline-none focus:border-blood"
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full resize-none border border-bone/15 bg-black/60 px-4 py-3 text-sm text-offwhite outline-none focus:border-blood"
      />
    </label>
  )
}
