"use client"

import { motion } from "framer-motion"
import { SubscribeForm } from "@/components/forms/SubscribeForm"
import { CAPTURE } from "@/content/bloodthirst"

/**
 * Capture band — the page's net for the visitor who scrolled but didn't buy.
 *
 * Reuses the house SubscribeForm (honeypot + double opt-in + source tagging),
 * dressed in BloodThirst voice. Source-tagged so Batch 001 leads are segmented
 * from the rest of the list. Access first; promos can still exist without
 * training the page to beg.
 */
export function RitualCapture() {
  return (
    <section
      data-phase="capture"
      className="relative z-10 mx-auto w-full max-w-3xl px-6 py-20 md:py-28"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative border border-bone/15 bg-black/55 p-7 backdrop-blur-md md:p-10"
      >
        {/* brutalist corner ticks — match the offer panel */}
        <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-blood/80" />
        <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-blood/80" />
        <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-blood/80" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-blood/80" />

        <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-blood/80">
          {CAPTURE.eyebrow}
        </p>
        <h2 className="mt-3 font-cinzel text-[clamp(1.6rem,4vw,2.6rem)] font-black uppercase leading-[1.05] tracking-[-0.005em] text-offwhite">
          {CAPTURE.title}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-bone/60 md:text-base">
          {CAPTURE.body}
        </p>

        <div className="mt-7">
          <SubscribeForm
            source="bloodthirst-batch-001"
            buttonLabel={CAPTURE.button}
            placeholder={CAPTURE.placeholder}
            successMessage={CAPTURE.success}
            formClassName="flex flex-col gap-2 sm:flex-row"
            inputClassName="min-w-0 flex-1 border border-bone/15 bg-black/60 px-4 py-3 font-mono text-sm tracking-wider text-offwhite placeholder:text-bone/30 outline-none transition-colors duration-200 focus:border-blood/70"
            buttonClassName="group inline-flex shrink-0 items-center justify-center gap-2 border border-blood bg-blood px-7 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-offwhite transition-colors duration-300 hover:bg-blood/85 disabled:cursor-not-allowed disabled:opacity-50"
            statusClassName="font-mono text-[10px] uppercase tracking-[0.22em] text-bone/55"
          />
        </div>

        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.35em] text-bone/35">
          {CAPTURE.finePrint}
        </p>
      </motion.div>
    </section>
  )
}
