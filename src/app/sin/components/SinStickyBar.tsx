"use client"

import { useEffect, useState } from "react"
import type { Pack } from "@/lib/shop/catalog"

/**
 * Mobile sticky buy bar — forked from /buy's StickyBuyBar and restyled.
 * Observer-driven: appears once the hero leaves the viewport, hides while the
 * checkout panel itself is on screen (no BUY button next to a bigger one).
 */
export function SinStickyBar({
  selected,
  total,
  onTap,
}: {
  selected: Pack
  total: number
  onTap: () => void
}) {
  const [heroGone, setHeroGone] = useState(false)
  const [panelInView, setPanelInView] = useState(false)

  useEffect(() => {
    const hero = document.getElementById("sin-hero")
    const panel = document.getElementById("sin-buy")
    if (!hero || !panel) return

    const heroObs = new IntersectionObserver(
      ([entry]) => setHeroGone(!entry.isIntersecting),
      { threshold: 0.15 }
    )
    const panelObs = new IntersectionObserver(
      ([entry]) => setPanelInView(entry.isIntersecting),
      { threshold: 0.05 }
    )
    heroObs.observe(hero)
    panelObs.observe(panel)
    return () => {
      heroObs.disconnect()
      panelObs.disconnect()
    }
  }, [])

  const visible = heroGone && !panelInView

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-[55] flex items-center justify-between gap-3 border-t border-bone/15 bg-black/85 px-4 pt-3 backdrop-blur-md transition-transform duration-300 ease-out md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-mono text-[9px] uppercase tracking-[0.3em] text-bone/55">
          {selected.qty} cans · ₹{selected.perCan}/can
        </span>
        <span className="font-cinzel text-xl font-black tabular-nums leading-none text-offwhite">
          ₹{total.toLocaleString("en-IN")}
        </span>
      </div>

      <button
        type="button"
        onClick={onTap}
        tabIndex={visible ? 0 : -1}
        className="group inline-flex shrink-0 items-center gap-2 border border-blood bg-blood px-7 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.34em] text-offwhite shadow-[0_0_30px_rgba(176,0,32,0.4)]"
      >
        <span>ACQUIRE</span>
        <span aria-hidden className="inline-block h-px w-4 bg-offwhite/70 transition-all duration-300 group-hover:w-7" />
      </button>
    </div>
  )
}
