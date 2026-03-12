"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"
import Image from "next/image"
import Reveal from "@/components/ux/Reveal"
import { TextReveal } from "@/components/ux/TextReveal"
import { ScrollCountUp } from "@/components/ux/ScrollCountUp"
import { Badges } from "@/components/shared/Badges"
import { MagneticButton } from "@/components/ux/MagneticButton"
import heroCan from "@/public/can.png"
import { LazyHeroBackground } from "@/components/ux/LazyHeroBackground"

export function HomeHero({ stats }: { stats: Array<{label: string, value: string}> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll over the 200vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Scrubbed glass panel rotation and scale based on scroll
  // All transforms arc back to resting state at scrollYProgress=1 so the
  // can never gets stuck in a mid-animation pose once the hero scrolls out.
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [0, -18, 0])
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [0, 10, 0])
  const rotateZ = useTransform(scrollYProgress, [0, 0.5, 1], [0, 5, 0])
  const scale   = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1.05, 0.95])

  // Extra parallax for the can itself, giving it deep 3D separation from the glass
  const canY     = useTransform(scrollYProgress, [0, 0.5, 1], [0, -75, 0])
  const canScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.15, 1])

  return (
    <div ref={containerRef} className="relative h-[200vh]">
      <section className="sticky top-0 h-screen overflow-hidden flex items-center">
        {/* Obsidian Liquid WebGL Shader Background */}
        <LazyHeroBackground />

        <div className="absolute inset-0 hero-gradient z-[1]" />
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-blood/20 blur-3xl z-[1]" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-blood/20 blur-3xl z-[1]" />

        <div className="container relative z-10 grid items-center gap-8 md:gap-12 md:grid-cols-2 pt-40 md:pt-0">
          <div className="space-y-6">
            <Reveal>
              <span className="badge border-blood/50 bg-blood/10 text-xs text-bone/80">
                THE CULT OF HYDRATION
              </span>
            </Reveal>
            <TextReveal
              text="Hydrate Your Sins"
              as="h1"
              className="h1 leading-tight"
              stagger={0.06}
            />
            <Reveal delay={0.3}>
              <p className="p text-lg">
                BloodThirst is premium natural mineral water in a can — gothic, rebellious, and brutally refreshing.
                Engineered for night rituals, morning recoveries, and everything unholy in between.
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <div className="flex flex-wrap gap-3">
                <MagneticButton>
                  <TransitionLink href="/bloodthirst" className="btn btn-primary">
                    Taste BloodThirst
                  </TransitionLink>
                </MagneticButton>
                <MagneticButton>
                  <TransitionLink href="/shop" className="btn btn-ghost">
                    Enter the Shop
                  </TransitionLink>
                </MagneticButton>
                <MagneticButton>
                  <TransitionLink href="/story" className="btn btn-ghost">
                    Our Story
                  </TransitionLink>
                </MagneticButton>
              </div>
            </Reveal>
            <Reveal delay={0.45}>
              <div className="grid grid-cols-2 gap-4 pt-6 text-sm sm:text-base">
                {stats.map((stat) => (
                  <div key={stat.label} className="stat-card">
                    <span className="block text-bone/70">{stat.label}</span>
                    <strong className="text-lg text-offwhite">
                      <ScrollCountUp progress={scrollYProgress} value={stat.value} />
                    </strong>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.5}>
              <Badges />
            </Reveal>
          </div>

          <div style={{ perspective: "1000px" }} className="flex justify-center items-center">
            <motion.div 
               style={{ rotateY, rotateX, rotateZ, scale, transformStyle: "preserve-3d" }}
               className="relative h-[360px] sm:h-[420px] md:h-auto md:aspect-[4/5] w-full overflow-visible rounded-[2.5rem] border border-ash/70 bg-ash/30 red-glow-strong backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_60%_20%,rgba(176,0,32,0.28),transparent_60%)] rounded-[2.5rem]" />
              <div className="absolute inset-y-10 left-10 w-1 bg-blood/40 blur-sm" />
              
              <motion.div 
                style={{ y: canY, scale: canScale, transformStyle: "preserve-3d" }}
                className="w-full h-full relative z-10"
              >
                <Image
                  src={heroCan}
                  alt="BloodThirst can"
                  fill
                  priority
                  className="object-contain p-6 drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
