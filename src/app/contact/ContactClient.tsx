"use client"

import { FormEvent, useState } from "react"
import { motion } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"
import {
  COMPANY_GSTIN,
  COMPANY_LEGAL_NAME,
  COMPANY_PRESS_EMAIL,
  COMPANY_REGISTERED_ADDRESS_LINES,
  COMPANY_SUPPORT_EMAIL,
} from "@/lib/site/company"

/* ─── Data ─── */

const inquiryTypes = ["Partnership", "Press", "Events", "Other"] as const
type InquiryType = (typeof inquiryTypes)[number]

const placeholders: Record<InquiryType, string> = {
  Partnership: "Tell us about the collab — brand, venue, product range...",
  Press: "Publication, angle, deadline...",
  Events: "Venue, date, expected attendance...",
  Other: "Whatever's on your mind...",
}

const contactChannels = [
  { label: "Email", value: COMPANY_SUPPORT_EMAIL, href: `mailto:${COMPANY_SUPPORT_EMAIL}` },
  { label: "Press", value: COMPANY_PRESS_EMAIL, href: `mailto:${COMPANY_PRESS_EMAIL}` },
]

/* ─── Types ─── */

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success" }
  | { state: "error"; message: string }

/* ─── Component ─── */

export function ContactClient() {
  const [inquiry, setInquiry] = useState<InquiryType>("Partnership")
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", company: "" })
  const [status, setStatus] = useState<Status>({ state: "idle" })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status.state === "sending") return // prevent double submit
    if (!form.name || !form.email || !form.message) {
      setStatus({ state: "error", message: "Name, email, and message are required." })
      return
    }
    setStatus({ state: "sending" })
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "contact",
          inquiry_type: inquiry,
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          company: form.company,
        }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.ok) throw new Error("Unable to send your message right now.")

      setStatus({ state: "success" })
      setForm({ name: "", email: "", phone: "", message: "", company: "" })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong."
      setStatus({ state: "error", message: msg })
    }
  }

  const inputClass =
    "mt-2 w-full border-b border-white/[0.12] bg-transparent py-3 text-sm text-offwhite placeholder-bone/20 outline-none transition-colors duration-200 focus:border-blood/60"

  return (
    <div className="min-h-screen px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-20 md:grid-cols-2 md:gap-24">

          {/* ─── LEFT: Info ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-6 text-[10px] uppercase tracking-[0.5em] text-blood/60">
              Summon the Coven
            </p>

            {/* Headline with blinking cursor */}
            <h1 className="font-cinzel text-4xl font-bold text-offwhite md:text-5xl lg:text-6xl">
              Let&apos;s conspire.
              {status.state !== "success" && (
                <motion.span
                  aria-hidden="true"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                  className="ml-2 inline-block h-[0.85em] w-[2px] translate-y-[0.05em] bg-blood align-middle"
                />
              )}
            </h1>

            <p className="mt-6 max-w-sm text-base leading-relaxed text-bone/50">
              Bookings, retail partnerships, sonic collaborations, press requests — whatever
              you&apos;re plotting, drop it below. We respond within 24 hours.
            </p>

            {/* Contact channels — plain rows */}
            <div className="mt-12">
              {contactChannels.map((ch, i) => (
                <div
                  key={ch.label}
                  className={`flex items-baseline justify-between py-4 border-b border-blood/[0.12] ${i === 0 ? "border-t" : ""}`}
                >
                  <span className="text-[10px] uppercase tracking-[0.35em] text-bone/30">
                    {ch.label}
                  </span>
                  <a
                    href={ch.href}
                    className="text-sm text-bone/60 transition-colors hover:text-blood"
                  >
                    {ch.value}
                  </a>
                </div>
              ))}
            </div>

            {/* Office hours */}
            <div className="mt-10 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.35em] text-bone/25 mb-3">Hours</p>
              <p className="text-sm text-bone/40">Mon – Sat · 11:00 to 20:00 IST</p>
              <p className="text-sm text-bone/25">We reply within 24 hours.</p>
            </div>

            <div className="mt-10 space-y-2 border-t border-blood/[0.12] pt-6">
              <p className="text-[10px] uppercase tracking-[0.35em] text-bone/25">
                Seller of record
              </p>
              <p className="text-sm text-bone/45">{COMPANY_LEGAL_NAME}</p>
              {COMPANY_REGISTERED_ADDRESS_LINES.map((line) => (
                <p key={line} className="text-sm text-bone/35">
                  {line}
                </p>
              ))}
              <p className="pt-2 text-sm text-bone/35">GSTIN: {COMPANY_GSTIN}</p>
            </div>
          </motion.div>

          {/* ─── RIGHT: Form ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Inquiry type pills */}
            <div className="mb-10 flex flex-wrap gap-2">
              {inquiryTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInquiry(type)}
                  className={`rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] transition-all duration-200 ${
                    inquiry === type
                      ? "border border-blood/70 bg-blood/10 text-blood"
                      : "border border-white/[0.08] text-bone/30 hover:border-white/20 hover:text-bone/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
              <input
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0"
                value={form.company}
                onChange={set("company")}
              />
              {/* Name */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.35em] text-bone/30">
                  Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.35em] text-bone/30">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@domain"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.35em] text-bone/30">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="+91"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.35em] text-bone/30">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={set("message")}
                  placeholder={placeholders[inquiry]}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Submit row */}
              <div className="flex items-center gap-6 pt-2">
                <button
                  type="submit"
                  disabled={status.state === "sending" || status.state === "success"}
                  className="btn btn-primary px-8 py-3 text-sm disabled:opacity-60"
                >
                  {status.state === "sending"
                    ? "Sending..."
                    : status.state === "success"
                    ? "Summoned ✓"
                    : "Send incantation"}
                </button>

                {status.state === "error" && (
                  <p className="text-xs text-blood/80">{status.message}</p>
                )}
              </div>

              {status.state === "success" && (
                <p className="text-xs text-bone/40">
                  Received. We&apos;ll respond within 24 hours.
                </p>
              )}
            </form>

            <p className="mt-8 text-xs text-bone/20">
              By submitting, you agree to receive mission-critical updates from UNHOLY CO.
              No spam, only rituals.{" "}
              <TransitionLink href="/legal" className="underline underline-offset-2 hover:text-bone/50">
                Legal
              </TransitionLink>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
