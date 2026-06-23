"use client"

import { SIN_FINAL } from "@/content/sin"
import { Kicker } from "./marks"

/** Final call — one menacing line and a last route back to the cans. */
export function SinFinal({ onBuy }: { onBuy: () => void }) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-4xl px-5 py-24 text-center md:px-10 md:py-32">
      <div className="flex justify-center">
        <Kicker>{SIN_FINAL.kicker}</Kicker>
      </div>
      <p className="mx-auto mt-7 max-w-2xl font-cinzel text-[clamp(1.8rem,5vw,3.2rem)] font-black uppercase leading-[1.05] tracking-[-0.01em] text-offwhite">
        {SIN_FINAL.line}
      </p>
      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={onBuy}
          className="group inline-flex items-center gap-3 border border-blood bg-blood px-10 py-5 font-mono text-xs font-bold uppercase tracking-[0.34em] text-offwhite shadow-[0_22px_70px_-14px_rgba(176,0,32,0.7)] transition-colors duration-300 hover:bg-[#c4072a]"
        >
          <span>{SIN_FINAL.cta}</span>
          <span aria-hidden className="inline-block h-px w-6 bg-offwhite/70 transition-all duration-300 group-hover:w-10" />
        </button>
      </div>
    </section>
  )
}
