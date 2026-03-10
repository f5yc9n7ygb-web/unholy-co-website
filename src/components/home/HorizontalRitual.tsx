"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import Reveal from "@/components/ux/Reveal"
import { SplitTextReveal } from "@/components/ux/SplitTextReveal"
import { TextScramble } from "@/components/ux/TextScramble"
import { SpringButton } from "@/components/ux/SpringButton"

export function HorizontalRitual({ ritualSteps }: { ritualSteps: Array<{title: string, body: string}> }) {
  const targetRef = useRef<HTMLDivElement>(null)
  
  // Track scroll over a 300vh timeline
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  })

  // Move the track horizontally from 0% to scrub through the steps
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"])

  return (
    <section className="bg-black text-white relative">
      {/* ── DESKTOP SCROLL CHOREOGRAPHY (md:block) ── */}
      <div ref={targetRef} className="hidden md:block relative h-[300vh]">
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          {/* Background glow for deep immersion */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(176,0,32,0.08),transparent_50%)] pointer-events-none" />

           <motion.div style={{ x }} className="flex gap-12 md:gap-24 px-8 md:px-24 w-[350vw] md:w-[180vw] z-10">
             
             <div className="w-[85vw] md:w-[45vw] flex-shrink-0 flex flex-col justify-center space-y-8 pr-10">
                <SplitTextReveal text="The BloodThirst Ritual" as="h2" className="text-4xl md:text-6xl font-semibold leading-tight" />
                <Reveal delay={0.05}>
                  <p className="text-lg text-offwhite/80">
                    This is more than hydration — it&apos;s a ceremony. Elevate your pre-game, your recovery, or your midnight grind
                    with a ritual that celebrates rebellion and sustainability in equal measure.
                  </p>
                </Reveal>
                <Reveal delay={0.1}>
                  <SpringButton>
                    <Link href="/bloodverse" className="nav-link inline-flex items-center text-sm font-medium text-bone hover:text-blood">
                      Explore the Bloodverse →
                    </Link>
                  </SpringButton>
                </Reveal>
             </div>
             
             {/* Steps translated horizontally */}
             {ritualSteps.map((step, index) => (
                <div key={step.title} className="w-[80vw] md:w-[32vw] flex-shrink-0 flex items-center">
                  <div className="glass-panel flex flex-col gap-8 w-full h-[400px] justify-center p-8 md:p-12 border border-blood/20 hover:border-blood/50 transition-colors shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blood/10 blur-3xl rounded-full transform translate-x-10 -translate-y-10 group-hover:bg-blood/20 transition-all duration-700" />
                    
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blood/15 text-blood text-xl font-bold border border-blood/30">
                      {index + 1}
                    </div>
                    <div>
                      <TextScramble
                        text={step.title}
                        as="h3"
                        className="text-2xl font-semibold text-offwhite md:text-3xl mb-4"
                        triggerOnView
                        triggerOnHover
                        speed={22}
                        revealDelay={45}
                      />
                      <p className="text-base text-offwhite/70 md:text-lg leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                </div>
             ))}
             
             {/* End padding spacer so the last card doesn't hit the right edge tightly */}
             <div className="w-[10vw] flex-shrink-0" />
           </motion.div>
        </div>
      </div>

      {/* ── MOBILE VERTICAL STACK (md:hidden) ── */}
      <div className="md:hidden relative py-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(176,0,32,0.1),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-16">
          <div className="flex flex-col space-y-6 text-center items-center">
            <SplitTextReveal text="The BloodThirst Ritual" as="h2" className="text-4xl font-semibold leading-tight" />
            <Reveal delay={0.05}>
              <p className="text-base text-offwhite/80">
                This is more than hydration — it&apos;s a ceremony. Elevate your pre-game, your recovery, or your midnight grind
                with a ritual that celebrates rebellion and sustainability in equal measure.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <SpringButton>
                <Link href="/bloodverse" className="nav-link inline-flex items-center text-sm font-medium text-bone hover:text-blood mt-2">
                  Explore the Bloodverse →
                </Link>
              </SpringButton>
            </Reveal>
          </div>

          <div className="flex flex-col gap-8">
            {ritualSteps.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.1}>
                <div className="glass-panel flex flex-col gap-6 w-full p-8 border border-blood/20 shadow-xl relative overflow-hidden group rounded-3xl bg-ash/10">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blood/10 blur-2xl rounded-full" />
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blood/15 text-blood font-bold border border-blood/30">
                    {index + 1}
                  </div>
                  <div>
                    <TextScramble
                      text={step.title}
                      as="h3"
                      className="text-xl font-semibold text-offwhite mb-3"
                      triggerOnView
                      speed={22}
                    />
                    <p className="text-sm text-offwhite/70 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
