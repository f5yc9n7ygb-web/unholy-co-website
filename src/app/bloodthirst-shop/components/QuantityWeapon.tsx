"use client"

import { PACKS, type Pack } from "@/lib/shop/catalog"

/**
 * Pack selector — three options laid out as a horizontal blade rack.
 * Looks more like choosing a weapon than a quantity selector.
 */
export function QuantityWeapon({
  selected,
  onSelect,
}: {
  selected: Pack
  onSelect: (p: Pack) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-px border border-bone/15 bg-bone/15 sm:grid-cols-3">
      {PACKS.map((pack) => {
        const active = pack.id === selected.id
        const starterPerCan = PACKS[0]?.perCan || pack.perCan
        const savings = Math.max(0, (starterPerCan - pack.perCan) * pack.qty)
        return (
          <button
            key={pack.id}
            data-rune
            onClick={() => onSelect(pack)}
            className={`relative grid min-h-[5.8rem] grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 text-left transition-all duration-300 sm:flex sm:min-h-[8.75rem] sm:flex-col sm:items-start sm:px-3 sm:py-4 md:min-h-[9.75rem] md:px-5 md:py-5 ${
              active
                ? "bg-blood text-offwhite"
                : "bg-black/85 text-bone/55 hover:bg-black/65 hover:text-offwhite"
            }`}
          >
            <span className="min-w-0">
              <span className={`block font-mono text-[8px] uppercase leading-relaxed tracking-[0.22em] opacity-80 sm:min-h-[1.4rem] sm:tracking-[0.24em] md:text-[9px] md:tracking-[0.35em] ${
                pack.tag && !active ? "text-blood" : ""
              }`}>
                {pack.tag || `Pack`}
              </span>
              <span className="mt-1 block font-cinzel text-3xl font-black uppercase leading-none sm:text-2xl md:text-3xl">
                {pack.qty}
                <span className="ml-1 align-top text-[10px] tracking-widest opacity-70">
                  cans
                </span>
              </span>
              <span className="mt-1.5 block font-cinzel text-base font-bold tabular-nums sm:mt-2">
                ₹{pack.price.toLocaleString("en-IN")}
              </span>
            </span>

            <span className="text-right sm:mt-auto sm:text-left">
              <span className="block whitespace-nowrap font-cinzel text-xl font-black tabular-nums leading-none sm:pt-3 sm:text-base md:text-xl">
                ₹{pack.perCan}/can
              </span>
              {savings > 0 && (
                <span className="mt-1 block font-mono text-[8px] uppercase leading-relaxed tracking-[0.2em] opacity-75">
                  Save ₹{savings.toLocaleString("en-IN")}
                </span>
              )}
            </span>

            {active && (
              <>
                <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-offwhite/80" />
                <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r border-t border-offwhite/80" />
                <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b border-l border-offwhite/80" />
                <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-offwhite/80" />
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
