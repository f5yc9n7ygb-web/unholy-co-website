"use client"

import { useEffect, useRef, useState } from "react"
import type React from "react"
import { X } from "lucide-react"

/**
 * Shared "absurd premium" inquiry features — Black Glove Delivery and
 * Do Not Buy This — used by both the desktop long-scroll page and the mobile
 * ritual. Both submit to /api/contact as inquiries (nothing is charged here).
 *
 * The modals own their own "sent" state so callers only need open/close wiring.
 */

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

export const BLACK_GLOVE_BREAKDOWN = [
  ["Founder's flight", 24999],
  ["Hotel because sleep is expensive", 11999],
  ["Black outfit procurement", 4999],
  ["Sunglasses for indoor judgement", 2999],
  ["Carrying crate with unnecessary seriousness", 7777],
  ["Doorstep silence", 4444],
  ["Judging your purchase decision", 9999],
  ["Awkward neighbor interaction risk", 6666],
  ['Saying "Stay Unholy" with a straight face', 3333],
  ["Emotional damage to founder", 8888],
  ["Actual delivery", 0],
  ["Convenience fee for poor decisions", 14897],
] as const

export function ModalFrame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    ;(focusables?.[0] ?? panel)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === "Tab" && focusables && focusables.length > 0) {
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-bone/15 bg-[#090909] p-6 text-bone shadow-2xl outline-none md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="modal-title" className="font-cinzel text-3xl font-black uppercase leading-tight text-offwhite">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close modal" className="p-2 text-bone/60 hover:text-offwhite">
            <X size={20} />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

function CartRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className={accent ? "text-green-300" : "text-offwhite"}>{value}</span>
    </div>
  )
}

function InquiryForm({
  idPrefix,
  inquiryType,
  contextLine,
  submitLabel,
  sentMessage,
  secondary,
}: {
  idPrefix: string
  inquiryType: string
  contextLine: string
  submitLabel: string
  sentMessage: string
  secondary?: React.ReactNode
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [details, setDetails] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (submitting) return
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Add your name and a valid email so we can reach you.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          inquiry_type: inquiryType,
          source: "bloodthirst-shop",
          message: `${contextLine}\nCity: ${city.trim() || "—"}\nDetails: ${details.trim() || "—"}`,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Could not send your inquiry right now. Email rituals@theunholy.co instead.")
      }
      setSent(true)
    } catch (err: any) {
      setError(err?.message || "Could not send your inquiry right now. Email rituals@theunholy.co instead.")
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="mt-6 border border-green-500/25 bg-green-500/10 p-4 text-sm text-green-300">
        {sentMessage}
      </div>
    )
  }

  const inputClass =
    "w-full border border-bone/15 bg-black/60 px-4 py-3 text-sm text-offwhite outline-none focus:border-blood"
  const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-bone/52"

  return (
    <div className="mt-6 grid gap-3">
      <div>
        <label htmlFor={`${idPrefix}-name`} className={labelClass}>Name</label>
        <input id={`${idPrefix}-name`} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className={inputClass} placeholder="Your name" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-email`} className={labelClass}>Email</label>
          <input id={`${idPrefix}-email`} value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className={inputClass} placeholder="you@domain.com" />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-phone`} className={labelClass}>Phone (optional)</label>
          <input id={`${idPrefix}-phone`} value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" className={inputClass} placeholder="10-digit mobile" />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-city`} className={labelClass}>City</label>
        <input id={`${idPrefix}-city`} value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" className={inputClass} placeholder="City" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-details`} className={labelClass}>Details</label>
        <textarea id={`${idPrefix}-details`} value={details} onChange={(event) => setDetails(event.target.value)} rows={3} className={`resize-none ${inputClass}`} placeholder="Anything we should know" />
      </div>
      {error && <p className="text-sm text-blood" role="alert">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={submit} disabled={submitting} className="bg-offwhite px-5 py-3 text-sm font-bold uppercase text-black transition-opacity disabled:opacity-55">
          {submitting ? "Sending…" : submitLabel}
        </button>
        {secondary}
      </div>
    </div>
  )
}

export function BlackGloveModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalFrame title="Black Glove Delivery" onClose={onClose}>
      <p className="text-sm leading-relaxed text-bone/68">
        Your BloodThirst, delivered by the founder, because normal shipping lacks emotional damage.
      </p>
      <div className="mt-6 space-y-2">
        {BLACK_GLOVE_BREAKDOWN.map(([label, price]) => (
          <CartRow key={label} label={label} value={money(price)} />
        ))}
        <div className="border-t border-bone/10 pt-3">
          <CartRow label="Total" value="₹1,00,000" />
        </div>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-bone/56">
        Inquiry only — nothing is charged here. Available only where physically possible. If we cannot complete the ritual, we&apos;ll contact you before accepting the order. We are dramatic, not fraudulent.
      </p>
      <InquiryForm
        idPrefix="bg"
        inquiryType="Black Glove Delivery"
        contextLine="Black Glove Delivery inquiry (₹1,00,000)."
        submitLabel="Summon the Founder"
        sentMessage="Inquiry marked. The founder has been emotionally notified. Check your inbox for confirmation."
        secondary={
          <button type="button" onClick={onClose} className="border border-bone/20 px-5 py-3 text-sm font-bold uppercase text-offwhite">
            Return to Normal Shipping Like a Coward
          </button>
        }
      />
    </ModalFrame>
  )
}

export function DoNotBuyModal({ onClose, onTakeTrial }: { onClose: () => void; onTakeTrial: () => void }) {
  return (
    <ModalFrame title="You clicked it. That's already concerning." onClose={onClose}>
      <p className="text-sm leading-relaxed text-bone/68">
        666 cans, a signed crate, a cursed note, entry into the Unholy Ledger, and enough hydration to make your accountant uncomfortable. This one&apos;s an inquiry — we confirm stock and logistics (and your wellbeing) before anything is charged.
      </p>
      <InquiryForm
        idPrefix="dnb"
        inquiryType="Do Not Buy This (666 cans)"
        contextLine="Do Not Buy This inquiry (₹66,666 — 666 cans, signed crate, ledger entry, founder judgement)."
        submitLabel="Proceed. I Am Unwell."
        sentMessage="Logged. Someone will reach out to confirm this poor decision before any payment."
        secondary={
          <button type="button" onClick={onTakeTrial} className="border border-bone/20 px-5 py-3 text-sm font-bold uppercase text-offwhite">
            Take Me Back to the ₹699 Pack.
          </button>
        }
      />
    </ModalFrame>
  )
}
