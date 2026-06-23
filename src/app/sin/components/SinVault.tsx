"use client"

import Link from "next/link"
import type { Route } from "next"
import { SIN_VAULT } from "@/content/sin"
import { SectionTitle } from "./marks"
import { Reveal } from "./Reveal"

/**
 * The vault — the "room" behind the teaser. Pure theater, kept off the cold buy
 * path: three items built to be SCREENSHOT and reposted, not to convert. Each is
 * a self-contained "case file" specimen (file no. + absurd status tag + one
 * quotable line) so a single card screenshots cleanly. The only off-site jump on
 * the page lives here, at the bottom of the funnel, where leaking a deep-scroller
 * is fine. Moved ABOVE SinFinal so the page still closes on CLAIM BATCH 001.
 */
export function SinVault() {
  return (
    <section
      id="sin-vault"
      className="relative z-10 scroll-mt-20 border-t border-bone/12 bg-black/40"
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <SectionTitle kicker={SIN_VAULT.kicker} title={SIN_VAULT.title} />
        </Reveal>
        <Reveal delay={60}>
          <p className="-mt-6 mb-10 max-w-xl text-sm leading-relaxed text-bone/55 md:text-base">
            {SIN_VAULT.blurb}
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {SIN_VAULT.items.map((item, i) => (
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

                <h3 className="mt-6 font-cinzel text-xl font-black uppercase leading-[1.05] text-offwhite md:text-2xl">
                  {item.name}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-bone/65">
                  {item.line}
                </p>
                <p className="mt-6 border-t border-bone/12 pt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40">
                  {item.note}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-9">
          <Link
            href={SIN_VAULT.ctaHref as Route}
            className="group inline-flex items-center gap-3 border border-bone/25 bg-transparent px-8 py-3.5 font-mono text-[11px] uppercase tracking-[0.36em] text-bone/80 transition-colors duration-300 hover:border-blood/70 hover:text-blood"
          >
            <span>{SIN_VAULT.cta}</span>
            <span aria-hidden className="inline-block h-px w-6 bg-bone/40 transition-all duration-300 group-hover:w-10 group-hover:bg-blood" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
