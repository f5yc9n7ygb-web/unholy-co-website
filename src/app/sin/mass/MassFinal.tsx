"use client"

import Link from "next/link"
import type { Route } from "next"
import { MASS_FINAL, MASS_FOOTER } from "@/content/sin-mass"
import { HardButton, Slam, Stamp } from "./theme"
import { MassDispatch } from "./MassDispatch"
import { MassCult } from "./MassCult"

/**
 * LAST CALL + footer. The page closes on a full-red slab with one line and
 * one black CTA — then a minimal black footer with support links.
 */
export function MassFinal({ onBuy }: { onBuy: () => void }) {
  return (
    <>
      <section
        id="sin-final"
        className="relative border-t-2 border-[#050505] bg-blood px-4 py-20 text-center md:px-10 md:py-28"
      >
        <Slam>
          <Stamp tone="ink" rotate={-2}>
            {MASS_FINAL.stamp}
          </Stamp>
          <p className="mx-auto mt-6 max-w-3xl font-anton text-[clamp(2.4rem,8.5vw,5.5rem)] uppercase leading-[0.95] tracking-[0.01em] text-[#050505]">
            {MASS_FINAL.line}
          </p>
          <div className="mt-9 flex flex-col items-center gap-4">
            <HardButton big tone="ink" onClick={onBuy} className="w-full sm:w-auto sm:min-w-[24rem]">
              {MASS_FINAL.cta}
              <span aria-hidden>→</span>
            </HardButton>
            <MassDispatch onBlood />
          </div>
        </Slam>
      </section>

      <MassCult />

      <footer className="border-t-2 border-blood bg-[#050505] px-4 py-12 text-center md:px-10">
        <nav
          aria-label="BloodThirst support"
          className="mb-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-3"
        >
          {MASS_FOOTER.links.map((link) => (
            <Link
              key={link.href}
              href={link.href as Route}
              className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-bone/50 transition-colors hover:text-blood"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="font-anton text-lg uppercase tracking-[0.12em] text-offwhite/80">
          {MASS_FOOTER.line}
        </p>
        <p className="mt-3 font-mono text-[9px] font-bold uppercase tracking-[0.5em] text-bone/30">
          — {MASS_FOOTER.endMark} —
        </p>
      </footer>
    </>
  )
}
