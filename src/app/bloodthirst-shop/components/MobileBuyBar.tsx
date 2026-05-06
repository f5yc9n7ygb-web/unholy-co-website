"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
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
  onTap,
}: {
  selected: Pack
  onTap: () => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  // Fade in after the user clears the hero (~70vh) and out near the offer (>5500px).
  // Using window scroll so we don't depend on a parent ref.
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 400, 800, 5400, 5800], [0, 0, 1, 1, 0])
  const pointerEvents = useTransform(opacity, (v) => (v > 0.05 ? "auto" : "none"))

  return (
    <motion.div
      ref={wrapRef}
      style={{ opacity, pointerEvents }}
      className="fixed inset-x-0 bottom-0 z-[55] flex items-center justify-between gap-3 border-t border-bone/15 bg-black/85 px-4 py-3 backdrop-blur-md md:hidden"
    >
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-bone/45">
          {selected.title} · {selected.qty} cans
        </span>
        <span className="font-cinzel text-xl font-black tabular-nums leading-none text-offwhite">
          ₹{selected.price.toLocaleString("en-IN")}
        </span>
      </div>

      <button
        data-rune
        onClick={onTap}
        className="group inline-flex shrink-0 items-center gap-2 border border-blood bg-blood px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-offwhite shadow-[0_0_30px_rgba(176,0,32,0.4)]"
      >
        <span>BUY</span>
        <span className="inline-block h-px w-4 bg-offwhite/70 transition-all duration-300 group-hover:w-7" />
      </button>
    </motion.div>
  )
}
