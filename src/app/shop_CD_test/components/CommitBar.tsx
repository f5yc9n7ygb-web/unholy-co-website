"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import type { Pack } from "@/lib/shop/catalog"
import { RollingPrice } from "./RollingPrice"

/**
 * Persistent bottom commit bar. Always visible, thumb-reachable on mobile.
 * Appears once the user has scrolled past the altar intro.
 */
export function CommitBar({
  selected,
  appliedDiscount = 0,
  onSeal,
}: {
  selected: Pack
  appliedDiscount?: number
  onSeal: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // Show once user has scrolled past one viewport
      setVisible(window.scrollY > window.innerHeight * 0.75)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null
      setInputFocused(!!target?.matches("input, textarea, select"))
    }
    const onFocusOut = () => setInputFocused(false)
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    return () => {
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
    }
  }, [])

  const total = selected.price - appliedDiscount

  return (
    <AnimatePresence>
      {visible && !inputFocused && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-[140] px-3 pb-3 md:px-6 md:pb-5"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div
            className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/80 px-3 py-2.5 backdrop-blur-xl md:gap-5 md:px-5 md:py-3.5"
            style={{
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(176,0,32,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Left: can thumb + details */}
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <div className="relative h-12 w-9 shrink-0 md:h-14 md:w-11">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="/can.webp"
                    alt=""
                    width={44}
                    height={76}
                    className="h-auto w-full drop-shadow-[0_6px_14px_rgba(176,0,32,0.6)]"
                    aria-hidden="true"
                  />
                </motion.div>
                <div
                  className="pointer-events-none absolute -inset-1 rounded-full opacity-60"
                  style={{ background: "radial-gradient(circle, rgba(176,0,32,0.35) 0%, transparent 60%)" }}
                />
              </div>
              <div className="min-w-0">
                <div className="truncate font-cinzel text-[10px] uppercase tracking-[0.25em] text-blood/70 md:text-[11px]">
                  {selected.qty} cans · checkout ready
                </div>
                <div className="flex items-baseline gap-2">
                  <RollingPrice
                    value={total}
                    prefix="₹"
                    className="font-cinzel text-xl font-black text-offwhite md:text-2xl"
                  />
                  <span className="hidden text-[10px] uppercase tracking-[0.25em] text-bone/40 sm:inline md:text-xs">
                    ₹{selected.perCan}/can
                  </span>
                </div>
              </div>
            </div>

            {/* Right: seal CTA */}
            <button
              type="button"
              onClick={onSeal}
              className="group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-xl bg-blood px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition-all hover:scale-[1.02] md:px-7 md:py-3.5 md:text-sm"
              style={{
                boxShadow: "0 0 30px rgba(176,0,32,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
              aria-label={`Checkout for ₹${total}`}
            >
              <span
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                aria-hidden="true"
              />
              <span className="relative">Checkout</span>
              <svg
                aria-hidden="true"
                className="relative h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 md:h-4 md:w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
