"use client"

import Link from "next/link"
import type { Route } from "next"
import { getPackById } from "@/lib/shop/catalog"
import { SIN_VAULT } from "@/content/sin"
import { SectionTitle } from "./marks"
import { Reveal } from "./Reveal"

/**
 * The vault — the "room" of pure theater. Two screenshot-specimen case files,
 * each now ACTIONABLE on /sin rather than linking off-site:
 *   • Black Glove  → opens the "drop your details" invitation inquiry
 *   • Do Not Buy   → buyable for real (₹66,666 / 666 cans) via the checkout sheet
 * The off-page jump to /bloodthirst-shop survives only as one subordinate
 * discovery line — the page no longer pushes buyers to another page.
 */
export function SinVault({
  onBlackGlove,
  onDoNotBuy,
}: {
  onBlackGlove: () => void
  onDoNotBuy: () => void
}) {
  // Do Not Buy's price is the real SKU price — never hardcoded in copy.
  const doNotBuyPrice = `₹${(getPackById("donotbuy")?.price ?? 0).toLocaleString("en-IN")}`

  return (
    <section
      id="sin-vault"
      className="relative z-10 scroll-mt-20 border-t border-bone/12 bg-black/40"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <SectionTitle kicker={SIN_VAULT.kicker} title={SIN_VAULT.title} index="07" />
        </Reveal>
        <Reveal delay={60}>
          <p className="-mt-6 mb-10 max-w-xl text-sm leading-relaxed text-bone/55 md:text-base">
            {SIN_VAULT.blurb}
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {SIN_VAULT.items.map((item, i) => {
            const note = item.note.replace("%PRICE%", doNotBuyPrice)
            const onClick = item.kind === "blackglove" ? onBlackGlove : onDoNotBuy
            return (
              <Reveal as="article" key={item.name} delay={i * 80}>
                <div className="group relative flex h-full flex-col border border-bone/14 bg-[#0b0b0b] p-6 transition-colors duration-300 hover:border-blood/40 md:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-bone/35">
                      {item.file}
                    </span>
                    <span className="shrink-0 border border-blood/40 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.24em] text-blood/85">
                      {item.status}
                    </span>
                  </div>

                  <h3 className="mt-6 font-cinzel text-2xl font-black uppercase leading-[1.05] text-offwhite md:text-3xl">
                    {item.name}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-bone/65">
                    {item.line}
                  </p>
                  <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40">
                    {note}
                  </p>

                  <button
                    type="button"
                    onClick={onClick}
                    className="group/btn mt-6 inline-flex items-center justify-between gap-3 border border-bone/25 bg-transparent px-5 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-offwhite transition-colors duration-300 hover:border-blood hover:bg-blood hover:text-offwhite"
                  >
                    <span>{item.action}</span>
                    <span aria-hidden className="inline-block h-px w-5 bg-bone/40 transition-all duration-300 group-hover/btn:w-9 group-hover/btn:bg-offwhite/70" />
                  </button>
                </div>
              </Reveal>
            )
          })}
        </div>

        {/* Soft discovery thread — subordinate, the only remaining off-page jump */}
        <Reveal delay={120} className="mt-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-bone/40">
            {SIN_VAULT.ritualNote}{" "}
            <Link
              href={SIN_VAULT.ritualHref as Route}
              className="text-bone/65 underline decoration-bone/25 underline-offset-4 transition-colors hover:text-blood"
            >
              {SIN_VAULT.ritualCta}
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
