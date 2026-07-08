"use client"

import Link from "next/link"

/**
 * RED MASS header — a hard black bar with a bottom rule, not a gradient fade.
 * Brand mark left, one loud BUY pill right. No nav maze for cold traffic.
 */
export function MassHeader({ onBuy }: { onBuy: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-4 border-b-2 border-blood bg-[#050505] px-4 py-2.5 md:px-8">
      <Link
        href="/"
        className="font-anton text-base uppercase tracking-[0.14em] text-offwhite transition-colors hover:text-blood md:text-lg"
      >
        UNHOLY&nbsp;CO.
      </Link>
      <span className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-bone/50 md:inline">
        BLOODTHIRST · BATCH 001
      </span>
      <button
        type="button"
        onClick={onBuy}
        className="border-2 border-offwhite bg-blood px-4 py-1.5 font-anton text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offwhite uppercase tracking-[0.1em] text-offwhite shadow-[3px_3px_0_#F6F6F6] transition-[transform,box-shadow] duration-150 hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0_#F6F6F6] md:px-5 md:text-base"
      >
        BUY NOW
      </button>
    </header>
  )
}
