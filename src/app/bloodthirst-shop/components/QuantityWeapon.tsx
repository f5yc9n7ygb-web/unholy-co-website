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
    <div className="grid grid-cols-3 gap-px border border-bone/15 bg-bone/15">
      {PACKS.map((pack) => {
        const active = pack.id === selected.id
        return (
          <button
            key={pack.id}
            data-rune
            onClick={() => onSelect(pack)}
            className={`relative flex flex-col items-start gap-2 px-5 py-5 text-left transition-all duration-300 ${
              active
                ? "bg-blood text-offwhite"
                : "bg-black/85 text-bone/55 hover:bg-black/65 hover:text-offwhite"
            }`}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.35em] opacity-70">
              {pack.tag || `Pack`}
            </span>
            <span className="font-cinzel text-2xl font-black uppercase leading-none md:text-3xl">
              {pack.qty}
              <span className="ml-1 align-top text-[10px] tracking-widest opacity-70">
                cans
              </span>
            </span>
            <span className="font-cinzel text-base font-bold tabular-nums">
              ₹{pack.price.toLocaleString("en-IN")}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] opacity-60">
              ₹{pack.perCan}/can
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
