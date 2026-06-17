"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Fragment, useRef } from "react"
import { ARRIVAL } from "@/content/bloodthirst"
import { PACKS, type Pack } from "@/lib/shop/catalog"

/**
 * Phase 1 — ARRIVAL.
 *
 * Tagline letter-by-letter cascade. No CTA. The product earns the CTA later.
 * Composition: batch tag top-left, scroll hint bottom-center, headline lower-third
 * with brutalist brackets so the can stays dominant in the upper-middle.
 */
export function PhaseArrival({
  selected,
  onSelect,
  onSkip,
}: {
  selected: Pack
  onSelect: (pack: Pack) => void
  onSkip?: () => void
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const headingOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0])
  const headingY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])

  const totalChars = ARRIVAL.tagline.length

  return (
    <section
      ref={ref}
      data-phase="arrival"
      className="relative h-screen w-full"
    >
      {/* Batch tag — top left, just below the header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4 }}
        className="absolute left-6 top-[80px] z-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/55 md:left-10 md:top-[96px]"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blood" />
        <span>{ARRIVAL.batch}</span>
      </motion.div>

      {/* Headline — lower-third, brackets framing it */}
      <motion.div
        style={{ opacity: headingOpacity, y: headingY }}
        className="absolute inset-x-0 bottom-[11vh] z-10 mx-auto max-w-6xl px-5 text-center sm:bottom-[14vh] md:bottom-[30vh] md:px-6 lg:bottom-[10vh]"
      >
        {/* Top bracket rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.45, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-7 h-px w-44 origin-center bg-gradient-to-r from-transparent via-blood to-transparent"
        />

        {/* Brutal serif tagline — letter cascade */}
        <h1 className="font-cinzel text-[clamp(2.25rem,6.4vw,5.65rem)] font-black uppercase leading-[0.92] tracking-[-0.01em] text-offwhite">
          <span aria-label={ARRIVAL.tagline} className="inline-block">
            {ARRIVAL.tagline.split(" ").map((word, wi, words) => {
              const beforeChars = words
                .slice(0, wi)
                .reduce((sum, w) => sum + w.length + 1, 0)
              return (
                <Fragment key={wi}>
                  {wi > 0 && " "}
                  <span className="inline-block whitespace-nowrap">
                    {word.split("").map((char, ci) => (
                      <motion.span
                        key={ci}
                        aria-hidden
                        initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{
                          delay: 0.55 + (beforeChars + ci) * 0.04,
                          duration: 0.7,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </span>
                </Fragment>
              )
            })}
          </span>
        </h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 + totalChars * 0.04 + 0.15, duration: 0.9 }}
          className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-bone/60 sm:mt-5 sm:text-xs sm:tracking-[0.36em]"
        >
          {ARRIVAL.subline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 + totalChars * 0.04 + 0.28, duration: 0.8 }}
          className="mx-auto mt-4 hidden max-w-3xl border border-bone/12 bg-black/82 px-4 py-3 backdrop-blur-sm xl:block xl:px-6"
        >
          <p className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.28em] text-bone/60 md:text-[10px] md:tracking-[0.38em]">
            {ARRIVAL.commerce}
          </p>
        </motion.div>

        {onSkip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + totalChars * 0.04 + 0.38, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-4 max-w-3xl"
          >
            <div className="hidden md:block">
              <HeroPackTeaser
                selected={selected}
                onChoose={(pack) => {
                  onSelect(pack)
                  onSkip()
                }}
              />
            </div>

            <HeroMobileOffer selected={selected} onSkip={onSkip} />

            <div className="mt-3 flex flex-col items-center justify-center gap-3 lg:flex-row lg:gap-4">
              <button
                data-rune
                onClick={onSkip}
                className="group inline-flex w-full max-w-xs items-center justify-center gap-3 border border-blood bg-blood px-6 py-3.5 font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-offwhite shadow-[0_0_34px_rgba(176,0,32,0.35)] transition-transform duration-150 ease-out active:scale-[0.98] lg:w-auto lg:min-w-[23rem]"
              >
                <span>{ARRIVAL.cta}</span>
                <span className="h-px w-5 bg-offwhite/70 transition-all duration-300 group-hover:w-8" />
              </button>
              <div className="flex max-w-xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 bg-black/45 px-3 py-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.18em] text-bone/52 backdrop-blur-sm lg:bg-transparent lg:px-0 lg:py-0 lg:text-[9px] lg:tracking-[0.24em]">
                {ARRIVAL.trust.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom bracket rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.55 + totalChars * 0.04 + 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-4 h-px w-44 origin-center bg-gradient-to-r from-transparent via-blood to-transparent md:mt-5"
        />
      </motion.div>

      {/* Scroll hint — bottom, fades fast */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        style={{ opacity: hintOpacity }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.5em] text-bone/40"
      >
        <span className="mr-3 inline-block h-px w-6 align-middle bg-bone/35" />
        scroll
        <span className="ml-3 inline-block h-px w-6 align-middle bg-bone/35" />
      </motion.div>

      {/* Subtle "or just buy" — appears bottom-right after the cascade */}
      {onSkip && (
        <motion.button
          data-rune
          onClick={onSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.8 }}
          style={{ opacity: hintOpacity }}
          className="absolute bottom-7 right-6 z-10 hidden items-center gap-2 border border-bone/15 bg-black/50 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.32em] text-bone/70 backdrop-blur-sm transition-colors hover:border-blood/60 hover:text-blood md:right-10 md:inline-flex md:text-[10px]"
        >
          <span>view offer</span>
          <span className="inline-block h-px w-5 bg-bone/30 transition-all duration-300 hover:w-8 hover:bg-blood" />
        </motion.button>
      )}
    </section>
  )
}

function HeroMobileOffer({
  selected,
  onSkip,
}: {
  selected: Pack
  onSkip: () => void
}) {
  const tag =
    selected.tag === "MOST POPULAR"
      ? "Popular"
      : selected.tag === "BEST VALUE"
        ? "Best value"
        : "Starter"

  return (
    <button
      type="button"
      data-rune
      onClick={onSkip}
      className="mx-auto grid w-full max-w-3xl grid-cols-[1fr_auto] items-end gap-3 border border-bone/15 bg-black/78 px-4 py-3 text-left backdrop-blur-sm md:hidden"
    >
      <span>
        <span className="block font-mono text-[8px] uppercase tracking-[0.28em] text-blood/80">
          {tag}
        </span>
        <span className="mt-1 block font-cinzel text-2xl font-black uppercase leading-none text-offwhite">
          {selected.qty}
          <span className="ml-1 align-top font-mono text-[9px] tracking-[0.2em] text-bone/60">
            cans
          </span>
        </span>
      </span>
      <span className="text-right">
        <span className="block font-cinzel text-xl font-black leading-none text-offwhite">
          ₹{selected.price.toLocaleString("en-IN")}
        </span>
        <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.18em] text-bone/55">
          ₹{selected.perCan}/can
        </span>
      </span>
    </button>
  )
}

function HeroPackTeaser({
  selected,
  onChoose,
}: {
  selected: Pack
  onChoose: (pack: Pack) => void
}) {
  return (
    <div
      aria-label="Choose BloodThirst pack"
      className="grid grid-cols-3 gap-px overflow-hidden border border-bone/15 bg-bone/15"
    >
      {PACKS.map((pack) => {
        const active = selected.id === pack.id
        const tag =
          pack.tag === "MOST POPULAR"
            ? "Popular"
            : pack.tag === "BEST VALUE"
              ? "Best value"
              : "Starter"
        return (
          <button
            key={pack.id}
            type="button"
            data-rune
            onClick={() => onChoose(pack)}
            className={`min-h-[4.2rem] px-2.5 py-2.5 text-left transition-colors duration-200 active:scale-[0.99] sm:min-h-[4.6rem] sm:px-4 ${
              active
                ? "bg-blood text-offwhite"
                : "bg-black/80 text-bone/62 hover:bg-black/65 hover:text-offwhite"
            }`}
          >
            <span className={`block min-h-[1rem] font-mono text-[7px] uppercase leading-tight tracking-[0.12em] sm:text-[8px] sm:tracking-[0.18em] ${
              pack.tag && !active ? "text-blood" : "opacity-70"
            }`}>
              {tag}
            </span>
            <span className="mt-0.5 block font-cinzel text-lg font-black uppercase leading-none tabular-nums sm:text-xl">
              {pack.qty}
              <span className="ml-1 align-top font-mono text-[8px] tracking-[0.18em] opacity-70">
                cans
              </span>
            </span>
            <span className="mt-1 block font-cinzel text-sm font-black leading-none tabular-nums sm:text-base">
              ₹{pack.price.toLocaleString("en-IN")}
            </span>
            <span className="mt-1 block font-mono text-[7px] uppercase tracking-[0.14em] opacity-70 sm:text-[8px]">
              ₹{pack.perCan}/can
            </span>
          </button>
        )
      })}
    </div>
  )
}
