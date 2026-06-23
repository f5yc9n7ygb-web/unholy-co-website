"use client"

import type { Pack } from "@/lib/shop/catalog"
import { SIN_BUY } from "@/content/sin"
import { SinPacks } from "./SinPacks"
import { SinDispatch } from "./SinDispatch"
import { Kicker } from "./marks"
import { Reveal } from "./Reveal"

/**
 * Section 02 — acquisition, slimmed. The page now only PICKS a pack here: rack
 * → live price → one ACQUIRE that opens the focused checkout sheet. The shipping
 * form, promo and pay button moved into SinCheckoutSheet so cold traffic isn't
 * staring at a full form mid-scroll. Reassurance stays on-page to kill
 * hesitation before the tap.
 */
export function SinCheckout({
  selected,
  onSelect,
  onAcquire,
}: {
  selected: Pack
  onSelect: (p: Pack) => void
  onAcquire: () => void
}) {
  // The on-page rack shows the PACK price only. Add-ons (the Cursed Note) are
  // chosen inside the sheet, so they belong on the sheet's total — never here,
  // where a previously-added note would silently inflate every pack's price.
  const total = selected.price.toLocaleString("en-IN")

  return (
    <section
      id="sin-buy"
      className="relative z-10 mx-auto w-full max-w-3xl scroll-mt-20 px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24"
    >
      <Reveal>
        <header className="mb-9 md:mb-12">
          <Kicker>{SIN_BUY.kicker}</Kicker>
          <h2 className="mt-4 font-cinzel text-[clamp(2rem,6vw,3.6rem)] font-black uppercase leading-[1.0] tracking-[-0.01em] text-offwhite">
            {SIN_BUY.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-bone/60 md:text-base">
            {SIN_BUY.subtitle}
          </p>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <div className="border border-bone/15 bg-[#0b0b0b]/80 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-4 border-b border-bone/15 px-5 py-3.5 md:px-7">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/50">
              {SIN_BUY.packsNote}
            </span>
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.28em] text-bone/45">
              500ml × {selected.qty}
            </span>
          </div>

          <div className="p-5 md:p-7">
            <SinPacks selected={selected} onSelect={onSelect} />

            {/* live price readout */}
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/55">
                {selected.title} · ₹{selected.perCan}/can
              </p>
              <span className="font-cinzel text-4xl font-black tabular-nums leading-none text-offwhite md:text-5xl">
                ₹{total}
              </span>
            </div>
            <p className="mt-1.5 text-right font-mono text-[9px] uppercase tracking-[0.26em] text-bone/50">
              {SIN_BUY.priceNote}
            </p>

            {/* CTA — opens the focused checkout sheet */}
            <button
              type="button"
              onClick={onAcquire}
              className="group relative mt-7 inline-flex w-full items-center justify-center gap-3 overflow-hidden border border-blood bg-blood px-8 py-5 text-center font-mono text-xs font-bold uppercase tracking-[0.28em] text-offwhite shadow-[0_22px_70px_-14px_rgba(176,0,32,0.75)] transition-colors duration-300 hover:bg-[#c4072a] md:text-sm md:tracking-[0.34em]"
            >
              <span>ACQUIRE — ₹{total}</span>
              <span aria-hidden className="inline-block h-px w-5 bg-offwhite/70 transition-all duration-300 group-hover:w-9" />
            </button>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <SinDispatch compact />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/45">
                {SIN_BUY.ctaFinePrint}
              </span>
            </div>

            {/* after-pay reassurance — kills hesitation right beside the button */}
            <ul className="mx-auto mt-7 w-full max-w-xl space-y-2 border-t border-dashed border-bone/15 px-1 pt-5 text-sm leading-relaxed text-bone/60">
              {SIN_BUY.afterPay.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-blood/80" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {SIN_BUY.trust.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone/50"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
