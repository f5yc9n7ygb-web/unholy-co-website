"use client"

import type { Pack } from "@/lib/shop/catalog"

/**
 * Mobile-only sticky bottom buy bar.
 *
 * The cinematic scroll is great on desktop but on a phone it's a long
 * descent before you reach the offer. This bar surfaces the price + a
 * tap-to-buy target after the user has cleared the arrival hero.
 *
 * Hidden on md+ where the cinematic experience runs uninterrupted.
 */
export function MobileBuyBar({
  selected,
  total,
  onTap,
  visible = true,
}: {
  selected: Pack
  total?: number
  onTap: () => void
  visible?: boolean
}) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-[55] flex items-center justify-between gap-3 border-t border-bone/15 bg-black/90 px-4 pt-3 backdrop-blur-md transition-[opacity,transform] duration-200 ease-out md:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-mono text-[9px] uppercase tracking-[0.25em] text-bone/55">
          {selected.qty} cans · ₹{selected.perCan}/can
        </span>
        <span className="font-cinzel text-xl font-black tabular-nums leading-none text-offwhite">
          ₹{(total ?? selected.price).toLocaleString("en-IN")}
        </span>
      </div>

      <button
        type="button"
        data-rune
        onClick={onTap}
        tabIndex={visible ? 0 : -1}
        className="group inline-flex shrink-0 items-center gap-2 border border-blood bg-blood px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-offwhite shadow-[0_0_30px_rgba(176,0,32,0.4)] active:scale-[0.98]"
      >
        <span>BUY</span>
        <span className="inline-block h-px w-4 bg-offwhite/70 transition-all duration-300 group-hover:w-7" />
      </button>
    </div>
  )
}
