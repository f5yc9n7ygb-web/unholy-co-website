"use client"

import { motion } from "framer-motion"
import type { Pack } from "@/lib/shop/catalog"
import type { ShippingForm } from "@/lib/shop/types"
import { OFFER } from "@/content/bloodthirst"
import { QuantityWeapon } from "./QuantityWeapon"
import { RitualButton } from "./RitualButton"
import { RitualForm } from "./RitualForm"
import type { FormErrors } from "../hooks/useRitualCheckout"

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
}) {
  return (
    <section data-phase="offer" className="relative w-full">
      {/* ── BEAT 1: Manifesto, full bleed ── */}
      <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-10 bg-blood/70" />
            <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-blood/80">
              {OFFER.eyebrow}
            </p>
          </div>

          <h2 className="font-cinzel text-[clamp(2rem,6.8vw,5.5rem)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-offwhite">
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
            className="mt-10 max-w-2xl text-base leading-relaxed text-bone/65 md:text-lg"
          >
            {OFFER.manifestoBody}
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
      <div className="relative mx-auto w-full max-w-4xl px-6 pb-24 pt-8 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative border border-bone/15 bg-black/65 p-7 backdrop-blur-md md:p-10"
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
          <div className="grid gap-7 md:grid-cols-[1.2fr,1fr] md:items-end">
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45">
                Choose the weight
              </p>
              <QuantityWeapon selected={selected} onSelect={onSelect} />
            </div>

            <div className="text-left md:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45">
                {selected.title}
              </p>
              <p className="mt-2 font-cinzel text-5xl font-black tabular-nums leading-none text-offwhite md:text-6xl">
                ₹{selected.price.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45">
                Incl. all taxes · Free across India
              </p>
            </div>
          </div>

          <div className="my-9 h-px w-full bg-bone/12" />

          {/* Form */}
          <RitualForm
            form={form}
            errors={errors}
            onChange={onChange}
            onBlur={onBlur}
          />

          <div className="my-9 h-px w-full bg-bone/12" />

          {/* CTA */}
          <div className="flex flex-col items-center gap-5">
            <RitualButton
              label={isSubmitting ? OFFER.ctaPending : OFFER.cta}
              onClick={onSign}
              pending={isSubmitting}
              disabled={isSubmitting}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/40">
              {OFFER.ctaFinePrint}
            </p>

            {payError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 max-w-md text-center font-mono text-[11px] uppercase tracking-[0.2em] text-blood"
                role="alert"
              >
                {payError}
              </motion.p>
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
