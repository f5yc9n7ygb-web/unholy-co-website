"use client"

import { PACKS, type Pack } from "@/lib/shop/catalog"
import { SIN_AVAILABLE_PACK_IDS } from "@/content/sin"

/**
 * Pack rack — forked from bloodthirst-shop/QuantityWeapon and restyled for the
 * "Black Room". Reuses the same PACKS source and selection contract; only the
 * visual treatment differs. Horizontal rows on mobile (big tap targets),
 * vitrine cards on md+. Active pack glows blood.
 */
export function SinPacks({
  selected,
  onSelect,
}: {
  selected: Pack
  onSelect: (p: Pack) => void
}) {
  const availablePacks = PACKS.filter((pack) =>
    SIN_AVAILABLE_PACK_IDS.includes(pack.id as (typeof SIN_AVAILABLE_PACK_IDS)[number])
  )
  const starterPerCan = availablePacks[0]?.perCan ?? selected.perCan

  return (
    <div
      role="radiogroup"
      aria-label="Choose your pack"
      className="grid grid-cols-1 gap-2 md:grid-cols-5 md:gap-2.5"
    >
      {availablePacks.map((pack) => {
        const active = pack.id === selected.id
        const savings = Math.max(0, (starterPerCan - pack.perCan) * pack.qty)
        return (
          <button
            key={pack.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(pack)}
            className={`group relative flex items-center justify-between gap-4 overflow-hidden border px-4 pb-3.5 pt-7 text-left transition-all duration-300 md:flex-col md:items-start md:justify-start md:gap-0 md:px-4 md:py-5 md:min-h-[10.5rem] ${
              active
                ? "border-blood bg-blood/[0.14] shadow-[0_0_44px_-12px_rgba(176,0,32,0.8)]"
                : "border-bone/12 bg-black/40 hover:border-bone/30 hover:bg-black/60"
            }`}
          >
            {/* tag / pack label */}
            <span
              className={`absolute left-4 top-2 font-mono text-[7.5px] uppercase tracking-[0.24em] md:static md:mb-3 ${
                pack.tag
                  ? active
                    ? "text-offwhite"
                    : "text-blood"
                  : active
                  ? "text-offwhite/70"
                  : "text-bone/40"
              }`}
            >
              {pack.tag || "PACK"}
            </span>

            {/* qty */}
            <span className="flex min-w-0 items-baseline gap-1.5 md:flex-col md:items-start md:gap-0">
              <span
                className={`font-cinzel text-3xl font-black uppercase leading-none md:text-4xl ${
                  active ? "text-offwhite" : "text-offwhite/90"
                }`}
              >
                {pack.qty}
              </span>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.28em] md:mt-1.5 ${
                  active ? "text-offwhite/75" : "text-bone/45"
                }`}
              >
                cans
              </span>
            </span>

            {/* price + per-can */}
            <span className="text-right md:mt-auto md:w-full md:text-left md:pt-4">
              <span
                className={`block font-cinzel text-lg font-black tabular-nums leading-none ${
                  active ? "text-offwhite" : "text-offwhite/90"
                }`}
              >
                ₹{pack.price.toLocaleString("en-IN")}
              </span>
              <span
                className={`mt-1 block whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] ${
                  active ? "text-offwhite/70" : "text-bone/45"
                }`}
              >
                ₹{pack.perCan}/can
                {savings > 0 && (
                  <span className={active ? "text-offwhite" : "text-blood/80"}>
                    {" · save ₹"}
                    {savings.toLocaleString("en-IN")}
                  </span>
                )}
              </span>
            </span>

            {/* active corner ticks */}
            {active && (
              <>
                <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-blood" />
                <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r border-t border-blood md:hidden" />
                <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-blood" />
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
