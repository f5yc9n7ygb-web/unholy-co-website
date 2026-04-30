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
 * Manifesto first, in display type. Then the product card materializes.
 * Form is inline. CTA reads as a signature.
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
    <section
      data-phase="offer"
      className="relative w-full px-6 py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* MANIFESTO */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 max-w-3xl"
        >
          <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.5em] text-blood/70">
            {OFFER.eyebrow}
          </p>

          <h2 className="font-cinzel text-[clamp(2rem,6.5vw,5.25rem)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-offwhite">
            {OFFER.manifesto.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>

          <p className="mt-8 max-w-2xl text-base leading-relaxed text-bone/65 md:text-lg">
            {OFFER.manifestoBody}
          </p>

          <p className="mt-6 font-cinzel text-lg font-black uppercase tracking-wider text-blood md:text-xl">
            {OFFER.closer}
          </p>
        </motion.div>

        {/* PRODUCT CARD — crystallizes via clip-path */}
        <motion.div
          initial={{ clipPath: "inset(50% 0% 50% 0%)", opacity: 0 }}
          whileInView={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="relative border border-bone/15 bg-black/55 p-7 backdrop-blur-md md:p-10"
          style={{
            boxShadow:
              "0 60px 120px -20px rgba(176,0,32,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Corner ticks */}
          <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-blood/80" />
          <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-blood/80" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-blood/80" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-blood/80" />

          {/* TOP: pack picker + headline price (no apology) */}
          <div className="grid gap-8 md:grid-cols-[1.2fr,1fr] md:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-blood/70">
                Choose the weight
              </p>
              <div className="mt-4">
                <QuantityWeapon selected={selected} onSelect={onSelect} />
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-bone/45">
                {selected.title}
              </p>
              <p className="mt-2 font-cinzel text-5xl font-black tabular-nums text-offwhite md:text-6xl">
                ₹{selected.price.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-bone/45">
                Incl. all taxes · Free across India
              </p>
            </div>
          </div>

          <div className="my-10 h-px w-full bg-bone/12" />

          {/* MIDDLE: shipping form */}
          <RitualForm
            form={form}
            errors={errors}
            onChange={onChange}
            onBlur={onBlur}
          />

          <div className="my-10 h-px w-full bg-bone/12" />

          {/* BOTTOM: signature CTA */}
          <div className="flex flex-col items-center gap-4">
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
                className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-blood"
                role="alert"
              >
                {payError}
              </motion.p>
            )}

            {/* trust strip */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {OFFER.trust.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[9px] uppercase tracking-[0.4em] text-bone/40"
                >
                  · {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
