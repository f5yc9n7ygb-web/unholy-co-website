import Image from "next/image"
import Link from "next/link"
import Reveal from "@/components/ux/Reveal"
import { Badges } from "@/components/shared/Badges"
import { SplitTextReveal } from "@/components/ux/SplitTextReveal"
import { TextScramble } from "@/components/ux/TextScramble"
import { CountUp } from "@/components/ux/CountUp"
import { SpringButton } from "@/components/ux/SpringButton"
import { ScrollSkew } from "@/components/ux/ScrollSkew"
import { Marquee } from "@/components/ux/Marquee"
import heroCan from "@/public/can.png"
import { HomeHero } from "@/components/home/HomeHero"
import { HorizontalRitual } from "@/components/home/HorizontalRitual"
import { ClipReveal } from "@/components/ux/ClipReveal"
import { FeatureGrid } from "@/components/home/FeatureGrid"

export const revalidate = 60

export default function HomePage() {
  const stats = [
    { label: "Mineral Blend", value: "12 trace elements" },
    { label: "Source Elevation", value: "5,200 ft" },
    { label: "Recycled Metal", value: "80% avg." },
    { label: "Serving Temp", value: "2°C ritual" },
  ]

  const features = [
    {
      title: "Mineral-Rich Source",
      body: "Drawn from volcanic terrain and filtered through obsidian rock for a naturally crisp, mineral-forward taste.",
    },
    {
      title: "Cold-Forged Aluminum",
      body: "360° light-proof armor keeps every can cold and untouched by plastic toxins — guilt-free, planet-first.",
    },
    {
      title: "Zero Sugar, Maximum Bite",
      body: "Pure hydration without fillers. BloodThirst is brutally refreshing with nothing to dull your edge.",
    },
    {
      title: "Forged for Nightlife",
      body: "Sleek matte finish glows under neon, looking at home in dive bars, underground clubs, and rooftop rituals alike.",
    },
  ]

  const ritualSteps = [
    {
      title: "Summon",
      body: "Grip the cold aluminum. Feel the pulse of the coven as condensation beads across the matte black shell.",
    },
    {
      title: "Break the Seal",
      body: "The hiss is your siren. That rush of pressure is minerals meeting oxygen — a signal you're alive.",
    },
    {
      title: "Consume the Sin",
      body: "Let the metallic snap wake your senses. Crisp, mineral-rich water that tastes like rebellion.",
    },
    {
      title: "Leave No Trace",
      body: "Crush the can. Recycle the armor. Repeat. Your ritual fuels the next drop.",
    },
  ]

  const testimonials = [
    {
      quote: "Finally a water brand that feels like it belongs to the underground. BloodThirst is the pre-show ritual now.",
      name: "ONYX",
      role: "Industrial DJ, Mumbai",
    },
    {
      quote: "Cold, crisp, and cinematic. The can alone pulls people in — the taste keeps them asking for more.",
      name: "IRA SHADOW",
      role: "Bar Manager, Bangalore",
    },
    {
      quote: "I quit single-use plastic this year and BloodThirst made it effortless. Obsessively good design and flavor.",
      name: "NISHA R.",
      role: "Creative Director",
    },
    {
      quote: "The packaging is insane. Everyone at the studio thought it was a limited-run art piece, not water.",
      name: "VIKRAM K.",
      role: "Photographer, Delhi",
    },
    {
      quote: "Best mixer we've ever stocked. The branding draws people in, the taste seals the deal.",
      name: "PRIYA M.",
      role: "Lounge Owner, Goa",
    },
  ]

  return (
    <div className="space-y-0">
      {/* HERO */}
      <HomeHero stats={stats} />

      {/* FEATURE GRID */}
      <section className="section">
        <div className="container space-y-10">
          <div className="max-w-2xl">
            <SplitTextReveal
              text="Why BloodThirst hits harder."
              as="h2"
              className="h2"
              stagger={0.035}
            />
            <Reveal delay={0.05}>
              <p className="p mt-3">
                We don&apos;t sip from plastic. We drink from armor. Every can is cold-forged minimalism engineered to keep
                purity in and the apocalypse out.
              </p>
            </Reveal>
          </div>

          <FeatureGrid features={features} />
        </div>
      </section>

      {/* RITUAL */}
      <HorizontalRitual ritualSteps={ritualSteps} />

      {/* TESTIMONIALS */}
      <ClipReveal direction="up">
        <section className="section bg-ash/10 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(176,0,32,0.1),transparent_50%)] pointer-events-none" />
          <div className="container space-y-10 relative z-10">
            <div className="max-w-xl">
              <SplitTextReveal text="Whispers from the coven" as="h2" className="h2" />
              <Reveal delay={0.05}>
                <p className="p mt-3">
                  BloodThirst travels with artists, mixologists, and creators who thrive after dark. Here&apos;s what they&apos;re saying.
                </p>
              </Reveal>
            </div>
          </div>
  
          <div className="mt-14 relative z-10">
            <ScrollSkew maxSkew={2.5} smooth={0.06}>
              <Marquee speed={40} pauseOnHover>
                {testimonials.map((t) => (
                  <figure
                    key={t.name}
                    className="glass-panel w-[340px] shrink-0 md:w-[400px] border border-ash/40 hover:border-blood/30 transition-colors"
                  >
                    <blockquote className="text-sm text-offwhite/80 md:text-base leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="mt-6 text-sm uppercase tracking-wide text-bone/70">
                      <TextScramble
                        text={t.name}
                        as="span"
                        className="block font-semibold text-offwhite"
                        triggerOnView
                        triggerOnHover={false}
                        speed={30}
                        revealDelay={50}
                      />
                      <span className="opacity-70">{t.role}</span>
                    </figcaption>
                  </figure>
                ))}
              </Marquee>
            </ScrollSkew>
          </div>
        </section>
      </ClipReveal>

      {/* FINAL CTA */}
      <ClipReveal direction="up" delay={0.1}>
        <section className="section relative overflow-hidden">
          {/* Intense red glow behind form */}
          <div className="absolute inset-x-0 -top-10 mx-auto h-60 max-w-3xl rounded-full bg-blood/15 blur-[100px] pointer-events-none" />
          
          <Reveal>
            <div className="glass-panel mx-auto max-w-3xl text-center border border-blood/20 p-12 relative z-10">
              <SplitTextReveal text="Join the Unholy circle" as="h2" className="h2" />
              <p className="p mt-4 text-lg text-offwhite/80 max-w-lg mx-auto">
                Drops, perks, and first taste. No spam — just your new favorite ritual.
              </p>
  
              <form
                className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
                action={process.env.NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT || "#"}
                method="post"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="flex-1 rounded-2xl border border-ash bg-ash/20 px-5 py-4 text-sm text-offwhite outline-none backdrop-blur-md transition hover:bg-ash/40 focus:border-blood focus:ring-2 focus:ring-blood/40"
                />
                <SpringButton>
                  <button className="btn btn-primary w-full sm:w-auto px-8" type="submit">
                    Stay Unholy
                  </button>
                </SpringButton>
              </form>
            </div>
          </Reveal>
        </section>
      </ClipReveal>
    </div>
  )
}
