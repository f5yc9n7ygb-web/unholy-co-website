"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { SplitTextReveal } from "@/components/ux/SplitTextReveal"
import { TextScramble } from "@/components/ux/TextScramble"
import Reveal from "@/components/ux/Reveal"
import { TransitionLink } from "@/components/ux/TransitionLink"

const steps = [
  {
    num: "01",
    title: "SUMMON",
    desc: "Grip the cold aluminum. The condensation on matte black isn't aesthetic — it's temperature. 500ml of high-altitude mineral water. This is where the ritual starts.",
  },
  {
    num: "02",
    title: "BREAK THE SEAL",
    desc: "That hiss is ancient mountain pressure meeting your room for the first time. It happens once, and then it's yours. Don't waste it on distraction.",
  },
  {
    num: "03",
    title: "CONSUME THE SIN",
    desc: "Crisp. Mineral-sharp. Impossibly clean. This is what water tastes like when it's actually been somewhere. No sugar, no flavoring — nothing between you and the mountain.",
  },
  {
    num: "04",
    title: "LEAVE NO TRACE",
    desc: "Crush the can. Toss it in recycling. Walk away knowing you just hydrated better than 99% of the room — and you didn't need to announce it.",
  },
]

function DesktopRitual() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const x = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "-72%"])

  return (
    <section ref={containerRef} className="relative hidden h-[400vh] overflow-x-hidden md:block">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-6 pl-[10vw]">
          {steps.map((step) => (
            <div
              key={step.num}
              className="glass-panel group relative w-[75vw] shrink-0 overflow-hidden p-10 lg:p-14"
            >
              <span className="absolute -top-10 -right-4 font-cinzel text-[28vw] font-black leading-none text-offwhite/[0.02] pointer-events-none select-none">
                {step.num}
              </span>

              <div className="relative z-10 mb-8">
                <span className="inline-block rounded-full border border-blood/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.3em] text-blood">
                  Step {step.num}
                </span>
              </div>

              <h3 className="relative z-10 mb-4 font-cinzel text-4xl font-bold tracking-wide text-offwhite lg:text-5xl">
                <TextScramble
                  text={step.title}
                  triggerOnView
                  speed={25}
                  revealDelay={40}
                />
              </h3>

              <div className="relative z-10 mb-5 h-px w-16 bg-gradient-to-r from-blood/40 to-transparent" />

              <p className="relative z-10 max-w-md text-sm leading-relaxed text-bone/50 lg:text-base">
                {step.desc}
              </p>

              <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-blood/30 via-blood/10 to-transparent" />
            </div>
          ))}

          <div className="flex w-[50vw] shrink-0 items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-bone/40">
                Continue the journey
              </p>
              <TransitionLink href="/bloodverse" className="btn btn-primary px-8 py-3 text-sm">
                Enter the Bloodverse
              </TransitionLink>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function MobileRitual() {
  return (
    <section className="space-y-4 px-4 pb-16 md:hidden">
      {steps.map((step, i) => (
        <Reveal key={step.num} delay={i * 0.08}>
          <div className="glass-panel relative overflow-hidden p-6">
            <span className="absolute -top-4 -right-2 font-cinzel text-[30vw] font-black leading-none text-offwhite/[0.02] pointer-events-none select-none">
              {step.num}
            </span>

            <span className="relative z-10 mb-4 inline-block rounded-full border border-blood/30 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.3em] text-blood">
              Step {step.num}
            </span>
            <h3 className="relative z-10 mb-2 font-cinzel text-xl font-bold tracking-wide text-offwhite">
              {step.title}
            </h3>
            <div className="relative z-10 mb-3 h-px w-10 bg-gradient-to-r from-blood/40 to-transparent" />
            <p className="relative z-10 text-xs leading-relaxed text-bone/50">
              {step.desc}
            </p>
          </div>
        </Reveal>
      ))}

      <Reveal delay={0.4}>
        <div className="pt-6 text-center">
          <TransitionLink href="/bloodverse" className="btn btn-primary px-8 py-3 text-sm">
            Enter the Bloodverse
          </TransitionLink>
        </div>
      </Reveal>
    </section>
  )
}

export default function HomeRitual() {
  return (
    <div>
      <div className="py-20 md:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-[10px] uppercase tracking-[0.4em] text-bone/40 md:text-xs"
          >
            The Process
          </motion.p>
          <SplitTextReveal
            text="THE RITUAL"
            as="h2"
            className="font-cinzel text-4xl font-bold text-offwhite md:text-6xl lg:text-7xl"
            stagger={0.04}
          />
        </div>
      </div>

      <DesktopRitual />
      <MobileRitual />
    </div>
  )
}
