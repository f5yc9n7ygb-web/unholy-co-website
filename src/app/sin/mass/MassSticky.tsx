"use client"

import { useEffect, useState } from "react"
import type { Pack } from "@/lib/shop/catalog"
import { MassDispatch } from "./MassDispatch"

/**
 * RED MASS sticky bar — a full blood band with a hard black rule, mobile only.
 * Appears when the hero leaves the viewport, hides while the buy slab is on
 * screen. Carries the pack, the price and the live dispatch clock at the thumb.
 */
export function MassSticky({
  selected,
  total,
  onTap,
}: {
  selected: Pack
  total: number
  onTap: () => void
}) {
  const [heroGone, setHeroGone] = useState(false)
  const [buyInView, setBuyInView] = useState(false)
  const [finalInView, setFinalInView] = useState(false)

  useEffect(() => {
    const hero = document.getElementById("sin-hero")
    const buy = document.getElementById("sin-buy")
    const finale = document.getElementById("sin-final")
    if (!hero || !buy) return
    const heroObs = new IntersectionObserver(
      ([entry]) => setHeroGone(!entry.isIntersecting),
      { threshold: 0.12 }
    )
    const buyObs = new IntersectionObserver(
      ([entry]) => setBuyInView(entry.isIntersecting),
      { threshold: 0.05 }
    )
    // The final slab carries its own full-width CTA + dispatch clock — the bar
    // would stack a duplicate red band on top of it.
    const finalObs = new IntersectionObserver(
      ([entry]) => setFinalInView(entry.isIntersecting),
      { threshold: 0.05 }
    )
    heroObs.observe(hero)
    buyObs.observe(buy)
    if (finale) finalObs.observe(finale)
    return () => {
      heroObs.disconnect()
      buyObs.disconnect()
      finalObs.disconnect()
    }
  }, [])

  const visible = heroGone && !buyInView && !finalInView

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-[55] border-t-2 border-[#050505] bg-blood transition-transform duration-300 ease-out md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.6rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex justify-center border-b-2 border-[#050505]/20 px-4 py-1">
        <MassDispatch onBlood />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 pt-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#050505]/75">
            {selected.qty} CANS · ₹{selected.perCan}/CAN
          </span>
          <span className="font-anton text-2xl leading-none text-[#050505]">
            ₹{total.toLocaleString("en-IN")}
          </span>
        </div>
        <button
          type="button"
          onClick={onTap}
          tabIndex={visible ? 0 : -1}
          className="shrink-0 border-2 border-offwhite bg-[#050505] px-6 py-2.5 font-anton text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offwhite uppercase tracking-[0.08em] text-offwhite shadow-[4px_4px_0_rgba(5,5,5,0.4)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          BUY NOW
        </button>
      </div>
    </div>
  )
}
