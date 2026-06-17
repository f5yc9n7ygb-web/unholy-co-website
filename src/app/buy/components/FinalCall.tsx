"use client"

import { BUY_FINAL } from "@/content/bloodthirst-buy"

/** Last page of the file — one line, one button, no new arguments. */
export function FinalCall({ onBuy }: { onBuy: () => void }) {
  return (
    <section className="relative mx-auto w-full max-w-5xl px-5 py-20 md:px-10 md:py-28">
      <h2 className="font-cinzel text-[clamp(2rem,7.5vw,5rem)] font-black uppercase leading-[0.95] text-offwhite">
        {BUY_FINAL.line}
      </h2>
      <div className="mt-10">
        <a
          href="#bt-buy"
          onClick={onBuy}
          className="inline-flex w-full max-w-[24rem] items-center justify-center gap-3 border border-blood bg-blood px-10 py-5 font-mono text-sm font-bold uppercase tracking-[0.3em] text-offwhite transition-colors duration-300 hover:bg-blood/85 md:w-auto"
        >
          {BUY_FINAL.cta}
          <span aria-hidden className="inline-block h-px w-6 bg-offwhite/70" />
        </a>
      </div>
    </section>
  )
}
