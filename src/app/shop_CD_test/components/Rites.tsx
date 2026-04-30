"use client"

import { motion } from "framer-motion"

/**
 * Beat 6 — the Rites.
 *
 * Three checkout assurances, reframed as rites of passage.
 * Copy stays aligned with the site's legal/refund policy.
 */

const RITES = [
  {
    mark: "I",
    title: "RITE OF DISPATCH",
    body: "Orders are packed for transit and dispatched quickly after payment verification. You get order confirmation and tracking as the shipment moves.",
  },
  {
    mark: "II",
    title: "RITE OF DAMAGE",
    body: "If your pack arrives damaged, incomplete, or materially incorrect, contact support within 48 hours with your order details for replacement or refund review.",
  },
  {
    mark: "III",
    title: "RITE OF CLARITY",
    body: "Prices include GST, shipping is free across India, and Razorpay handles secure payment through UPI, cards, net banking, and wallets.",
  },
]

export function Rites() {
  return (
    <section className="relative overflow-hidden bg-black py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 700px 400px at 50% 20%, rgba(176,0,32,0.08), transparent 70%)",
        }}
      />

      <div className="container relative mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-14 max-w-3xl text-center md:mb-20"
        >
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.5em] text-blood/70 md:text-[11px]">
            // the three rites
          </p>
          <h2 className="font-cinzel text-3xl font-black uppercase leading-[0.95] text-offwhite md:text-5xl">
            Three promises.<br />
            <span className="text-blood">Built for checkout.</span>
          </h2>
          <p className="mt-5 text-sm text-bone/50 md:text-base">
            The ritual stays theatrical. The order terms stay clear.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {RITES.map((rite, i) => (
            <motion.div
              key={rite.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.8,
                delay: i * 0.14,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-black to-black/40 p-7 transition-all duration-500 hover:border-blood/40 md:p-8"
            >
              {/* Corner ornament */}
              <span
                className="pointer-events-none absolute right-5 top-5 font-cinzel text-5xl font-black leading-none text-blood/10 transition-colors duration-500 group-hover:text-blood/25 md:text-6xl"
                aria-hidden="true"
              >
                {rite.mark}
              </span>

              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(ellipse 400px 200px at 30% 10%, rgba(176,0,32,0.12), transparent 70%)",
                }}
              />

              <div className="relative">
                <div className="mb-6 h-px w-12 bg-gradient-to-r from-blood to-transparent" />
                <h3 className="mb-4 font-cinzel text-lg font-black uppercase tracking-[0.15em] text-offwhite md:text-xl">
                  {rite.title}
                </h3>
                <p className="text-sm leading-relaxed text-bone/60 md:text-[15px]">
                  {rite.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
