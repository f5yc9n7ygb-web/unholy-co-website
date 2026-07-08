"use client"

import Link from "next/link"
import type { Route } from "next"
import { getPackById } from "@/lib/shop/catalog"
import { MASS_VAULT } from "@/content/sin-mass"
import { Halftone, Slam, SlabHead, Stamp } from "./theme"

/**
 * THE FORBIDDEN SHELF — the theater, kept below the money and fully on-page:
 * Black Glove opens the inquiry modal, Do Not Buy really sells the ₹66,666
 * stunt SKU through the same checkout sheet. Cards are classified-drop
 * posters built to be screenshotted. One subordinate off-page link survives.
 */
export function MassVault({
  onBlackGlove,
  onDoNotBuy,
}: {
  onBlackGlove: () => void
  onDoNotBuy: () => void
}) {
  // Price always derives from the live SKU — never hardcoded in copy.
  const doNotBuyPrice = `₹${(getPackById("donotbuy")?.price ?? 0).toLocaleString("en-IN")}`

  return (
    <section
      id="sin-vault"
      className="relative scroll-mt-14 overflow-hidden border-t-2 border-blood bg-[#050505] px-4 py-16 md:px-10 md:py-24"
    >
      <Halftone className="left-[-4%] bottom-[-6%] h-[40%] w-[50%] opacity-40" />

      <div className="relative mx-auto w-full max-w-5xl">
        <Slam>
          <SlabHead stamp={MASS_VAULT.stamp} title={MASS_VAULT.title} sub={MASS_VAULT.sub} />
        </Slam>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {MASS_VAULT.items.map((item, i) => {
            const note = item.note.replace("%PRICE%", doNotBuyPrice)
            const onClick = item.kind === "blackglove" ? onBlackGlove : onDoNotBuy
            return (
              <Slam key={item.name} delay={i * 90}>
                <article
                  className="relative flex h-full flex-col border-2 border-offwhite bg-[#0a0a0a] p-6 shadow-[8px_8px_0_#B00020] md:p-7"
                  style={{ transform: `rotate(${i % 2 ? 0.5 : -0.5}deg)` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-bone/45">
                      {item.file}
                    </span>
                    <Stamp tone="blood" rotate={2} className="px-2 py-1 text-[8px]">
                      {item.status}
                    </Stamp>
                  </div>

                  <h3 className="mt-5 font-anton text-4xl uppercase leading-[0.95] tracking-[0.02em] text-offwhite md:text-5xl">
                    {item.name}
                  </h3>
                  <p className="mt-4 flex-1 font-mono text-xs leading-relaxed text-bone/70">
                    {item.line}
                  </p>
                  <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blood">
                    {note}
                  </p>

                  <button
                    type="button"
                    onClick={onClick}
                    className="mt-5 w-full border-2 border-offwhite bg-transparent px-5 py-3.5 text-center font-anton text-lg uppercase tracking-[0.08em] text-offwhite transition-colors duration-150 hover:border-blood hover:bg-blood focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offwhite"
                  >
                    {item.action}
                  </button>
                </article>
              </Slam>
            )
          })}
        </div>

        {/* subordinate discovery thread — the only off-page jump */}
        <Slam delay={160}>
          <p className="mt-10 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-bone/45">
            {MASS_VAULT.ritualNote}{" "}
            <Link
              href={MASS_VAULT.ritualHref as Route}
              className="text-bone/70 underline decoration-blood decoration-2 underline-offset-4 transition-colors hover:text-blood"
            >
              {MASS_VAULT.ritualCta}
            </Link>
          </p>
        </Slam>
      </div>
    </section>
  )
}
