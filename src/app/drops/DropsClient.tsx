"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"
import { SubscribeForm } from "@/components/forms/SubscribeForm"
import drops from "@/content/drops.json"

const fadeUp = (delay = 0) => ({
  initial: { y: 16 },
  animate: { y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
})

function useCountdown(target: string) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false })

  useEffect(() => {
    const t = new Date(target).getTime()
    const tick = () => {
      const diff = Math.max(0, t - Date.now())
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor(diff / 3600000) % 24,
        m: Math.floor(diff / 60000) % 60,
        s: Math.floor(diff / 1000) % 60,
        expired: diff === 0,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  return time
}

function CountdownDisplay({ target }: { target: string }) {
  const { d, h, m, s, expired } = useCountdown(target)

  if (expired) {
    return (
      <p className="text-[10px] uppercase tracking-[0.4em] text-blood/60">Drop live</p>
    )
  }

  const units = [
    { label: "days", value: d },
    { label: "hrs", value: h },
    { label: "min", value: m },
    { label: "sec", value: s },
  ]

  return (
    <div className="flex items-end gap-0">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-end">
          <div className="text-center min-w-[52px]">
            <div className="font-cinzel text-3xl font-bold text-offwhite tabular-nums md:text-4xl">
              {String(unit.value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.35em] text-bone/35">
              {unit.label}
            </div>
          </div>
          {i < units.length - 1 && (
            <span className="pb-[10px] px-1 font-cinzel text-xl text-blood/30 md:text-2xl">:</span>
          )}
        </div>
      ))}
    </div>
  )
}

const statusConfig: Record<string, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: "text-blood/70 border-blood/20 bg-blood/[0.06]" },
  live:     { label: "Live Now", color: "text-blood border-blood/40 bg-blood/10" },
  closed:   { label: "Closed",   color: "text-bone/30 border-bone/10 bg-bone/[0.04]" },
}

export function DropsClient() {
  return (
    <div className="relative min-h-[90vh] overflow-hidden">
      {/* Ghost watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-start justify-end select-none overflow-hidden pr-6 pt-20 md:pt-28"
      >
        <span className="font-cinzel font-black text-[16vw] leading-none text-bone/[0.03]">
          DROPS
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 md:py-36">

        {/* Header */}
        <motion.div {...fadeUp(0)} className="mb-16">
          <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/60">
            Limited Runs
          </p>
          <h1 className="font-cinzel text-4xl font-bold text-offwhite md:text-5xl lg:text-6xl">
            Every drop is<br className="hidden md:block" /> a ritual.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-bone/45 md:text-base">
            When the sigil glows, something rare is coming. Claim your slot, unlock lore, and stay ahead of the believers.
          </p>
        </motion.div>

        {/* Drop cards */}
        <div className="space-y-0">
          {drops.map((drop, i) => {
            const cfg = statusConfig[drop.status ?? "upcoming"] ?? statusConfig.upcoming
            const padded = String(i + 1).padStart(2, "0")

            return (
              <motion.div key={drop.id} {...fadeUp(0.1 + i * 0.08)}>
                <div className="h-px bg-blood/[0.15]" />
                <div className="py-10">

                  {/* Top row */}
                  <div className="mb-6 flex items-center justify-between">
                    <span className="font-cinzel text-xs font-bold text-blood/25">{padded}</span>
                    <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Title + blurb */}
                  <h2 className="font-cinzel text-2xl font-bold text-offwhite md:text-3xl">
                    {drop.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-bone/50">
                    {drop.blurb}
                  </p>

                  {/* Date */}
                  <p className="mt-4 text-[10px] uppercase tracking-[0.4em] text-bone/25">
                    {new Date(drop.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {/* Countdown */}
                  <div className="mt-7 rounded-xl border border-blood/[0.12] bg-blood/[0.04] px-6 py-6">
                    <p className="mb-5 text-[9px] uppercase tracking-[0.45em] text-bone/25">
                      Drops in
                    </p>
                    <CountdownDisplay target={drop.date} />
                  </div>

                  {/* Subscribe or closed */}
                  <div className="mt-6">
                    {drop.notify ? (
                      <div>
                        <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-bone/35">
                          Get notified
                        </p>
                        <SubscribeForm
                          source={`drop_${drop.id}`}
                          buttonLabel="Notify me"
                          placeholder="your@email.com"
                          formClassName="flex flex-col gap-3 sm:flex-row sm:items-center"
                          inputClassName="flex-1 rounded-lg border border-white/[0.08] bg-black/50 px-4 py-3 text-sm text-offwhite placeholder-bone/25 outline-none transition focus:border-blood/50 focus:ring-1 focus:ring-blood/30"
                          buttonClassName="btn btn-primary px-6 py-3 text-sm"
                          statusClassName="text-xs text-bone/40"
                          successMessage="You're on the list for this drop."
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] uppercase tracking-[0.35em] text-bone/25">
                        Drop closed
                      </p>
                    )}
                  </div>

                </div>
              </motion.div>
            )
          })}
          <div className="h-px bg-blood/[0.15]" />
        </div>

        {/* CTAs */}
        <motion.div {...fadeUp(0.35)} className="mt-14 flex flex-wrap gap-4">
          <TransitionLink href="/shop" className="btn btn-primary px-6 py-3 text-sm">
            Shop core packs
          </TransitionLink>
          <TransitionLink href="/bloodverse" className="btn btn-ghost px-6 py-3 text-sm">
            Read the Bloodverse
          </TransitionLink>
        </motion.div>

      </div>
    </div>
  )
}
