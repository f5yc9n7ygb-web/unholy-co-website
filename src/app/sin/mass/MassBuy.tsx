"use client"

import { PACKS, type Pack } from "@/lib/shop/catalog"
import { SIN_AVAILABLE_PACK_IDS } from "@/content/sin"
import { MASS_BUY } from "@/content/sin-mass"
import { HardButton, Slam, SlabHead, Stamp } from "./theme"
import { MassDispatch } from "./MassDispatch"
import { MassPincode } from "./MassPincode"

/**
 * THE DROP — the money slab, and the only section that floods full RED.
 * Pack rows stack like a drop list; the selected row INVERTS to black so the
 * choice is unmistakable from across the room. One BUY NOW slab, the live
 * dispatch clock, then flat, honest reassurance lines. Sober where it counts.
 */
export function MassBuy({
  selected,
  onSelect,
  onAcquire,
}: {
  selected: Pack
  onSelect: (p: Pack) => void
  onAcquire: () => void
}) {
  const packs = PACKS.filter((p) =>
    SIN_AVAILABLE_PACK_IDS.includes(p.id as (typeof SIN_AVAILABLE_PACK_IDS)[number])
  )
  const starterPerCan = packs[0]?.perCan ?? selected.perCan
  // The slab shows the PACK price only — add-ons surface inside the checkout
  // sheet where they're itemized and removable (price-transparency rule).
  const total = selected.price.toLocaleString("en-IN")

  return (
    <section
      id="sin-buy"
      className="relative scroll-mt-14 border-y-2 border-[#050505] bg-blood px-4 py-16 md:px-10 md:py-24"
    >
      <div className="relative mx-auto w-full max-w-3xl">
        <Slam>
          <SlabHead onBlood stamp={MASS_BUY.stamp} title={MASS_BUY.title} sub={MASS_BUY.sub} />
        </Slam>

        {/* ── Pack rows ── */}
        <div role="radiogroup" aria-label="Choose your pack" className="space-y-3">
          {packs.map((pack, i) => {
            const active = pack.id === selected.id
            const savings = Math.max(0, (starterPerCan - pack.perCan) * pack.qty)
            const tag = MASS_BUY.tagOverrides[pack.id] ?? pack.tag
            return (
              <Slam key={pack.id} delay={i * 70}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelect(pack)}
                  className={`relative flex w-full items-center gap-4 border-2 border-[#050505] px-4 py-4 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505] md:gap-6 md:px-6 md:py-5 ${
                    active
                      ? "bg-[#050505] text-offwhite shadow-[6px_6px_0_rgba(5,5,5,0.4)]"
                      : "bg-blood text-[#050505] hover:bg-[#c00825]"
                  }`}
                >
                  {/* qty numeral */}
                  <span
                    className={`w-16 shrink-0 text-center font-anton text-5xl leading-none md:w-24 md:text-6xl ${
                      active ? "text-blood" : "text-[#050505]"
                    }`}
                  >
                    {pack.qty}
                  </span>

                  {/* name + per-can */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-anton text-lg uppercase tracking-[0.04em] md:text-2xl">
                      {pack.title}
                    </span>
                    <span
                      className={`mt-0.5 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] md:text-[11px] ${
                        active ? "text-bone/60" : "text-[#050505]/70"
                      }`}
                    >
                      ₹{pack.perCan}/CAN
                      {savings > 0 && ` · SAVE ₹${savings.toLocaleString("en-IN")}`}
                    </span>
                  </span>

                  {/* price */}
                  <span className="shrink-0 text-right">
                    <span className="block font-anton text-2xl leading-none tracking-[0.02em] md:text-4xl">
                      ₹{pack.price.toLocaleString("en-IN")}
                    </span>
                  </span>

                  {/* badges */}
                  {tag && !active && (
                    <span className="absolute -right-1.5 -top-3.5">
                      <Stamp tone="paper" rotate={2} className="px-2 py-1 text-[8px] md:text-[9px]">
                        {tag}
                      </Stamp>
                    </span>
                  )}
                  {active && (
                    <span className="absolute -right-1.5 -top-3.5">
                      <Stamp tone="blood" rotate={-2} className="px-2 py-1 text-[8px] md:text-[9px]">
                        ✓ {MASS_BUY.rowCta}
                      </Stamp>
                    </span>
                  )}
                </button>
              </Slam>
            )
          })}
        </div>

        {/* ── Buy slab ── */}
        <Slam delay={120}>
          <div className="mt-8">
            <HardButton big tone="ink" onClick={onAcquire} className="w-full">
              {MASS_BUY.cta} — ₹{total}
              <span aria-hidden>→</span>
            </HardButton>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <MassDispatch onBlood />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#050505]/70 md:text-[10px]">
                {MASS_BUY.priceNote}
              </span>
            </div>
            <p className="mt-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#050505]/60">
              {MASS_BUY.finePrint}
            </p>
            <p className="mt-4 border-l-4 border-[#050505] pl-3 font-mono text-xs leading-relaxed text-[#050505]/85">
              {MASS_BUY.addOnTease}
            </p>
          </div>
        </Slam>

        {/* pincode serviceability — personalises the delivery promise */}
        <Slam delay={140}>
          <div className="mt-7">
            <MassPincode />
          </div>
        </Slam>

        {/* ── Flat reassurance — sober, right beside the money ── */}
        <Slam delay={160}>
          <ul className="mt-8 space-y-2.5 border-t-2 border-[#050505]/25 pt-6">
            {MASS_BUY.afterPay.map((line) => (
              <li
                key={line}
                className="flex gap-3 font-mono text-xs leading-relaxed text-[#050505]/85 md:text-[13px]"
              >
                <span aria-hidden className="mt-[3px] shrink-0 text-[#050505]">
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </Slam>
      </div>
    </section>
  )
}
