import Image from "next/image"
import Link from "next/link"
import Reveal from "@/components/ux/Reveal"
import Parallax from "@/components/ux/Parallax"
import { Badges } from "@/components/shared/Badges"
import { TextReveal } from "@/components/ux/TextReveal"
import { CountUp } from "@/components/ux/CountUp"
import { MagneticButton } from "@/components/ux/MagneticButton"
import { Marquee } from "@/components/ux/Marquee"
import heroCan from "../../public/can.png"

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
      <section className="section relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Video background */}
        <div className="absolute inset-0 z-0 bg-black">
          <Image
            src="/sexy-hero-bg.png"
            alt="Unholy Co Hero Texture"
            fill
            priority
            className="object-cover opacity-80"
          />
          {/* Dark overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </div>

        <div className="absolute inset-0 hero-gradient z-[1]" />
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-blood/20 blur-3xl z-[1]" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-blood/20 blur-3xl z-[1]" />

        <div className="container relative z-10 grid items-center gap-12 md:grid-cols-2">
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
                  <Link href="/bloodthirst" className="btn btn-primary">
                    Taste BloodThirst
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link href="/shop" className="btn btn-ghost">
                    Enter the Shop
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link href="/story" className="btn btn-ghost">
                    Our Story
                  </Link>
                </MagneticButton>
              </div>
            </Reveal>
            <Reveal delay={0.45}>
              <div className="grid grid-cols-2 gap-4 pt-6 text-sm sm:text-base">
                {stats.map((stat) => (
                  <div key={stat.label} className="stat-card">
                    <span className="block text-bone/70">{stat.label}</span>
                    <strong className="text-lg text-offwhite">
                      <CountUp value={stat.value} />
                    </strong>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.5}>
              <Badges />
            </Reveal>
          </div>

          <Parallax amt={80}>
            <div className="relative h-[360px] sm:h-[420px] md:h-auto md:aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] border border-ash/70 bg-ash/30 red-glow-strong backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_60%_20%,rgba(176,0,32,0.28),transparent_60%)]" />
              <div className="absolute inset-y-10 left-10 w-1 bg-blood/40 blur-sm" />
              <Image
                src={heroCan}
                alt="BloodThirst can"
                fill
                priority
                className="object-contain p-6 animate-float"
              />
            </div>
          </Parallax>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="section">
        <div className="container space-y-10">
          <div className="max-w-2xl">
            <TextReveal
              text="Why BloodThirst hits harder."
              as="h2"
              className="h2"
              stagger={0.05}
            />
            <Reveal delay={0.05}>
              <p className="p mt-3">
                We don&apos;t sip from plastic. We drink from armor. Every can is cold-forged minimalism engineered to keep
                purity in and the apocalypse out.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.08}>
                <article className="glass-panel h-full">
                  <h3 className="text-lg font-semibold text-offwhite">{feature.title}</h3>
                  <p className="mt-3 text-sm text-offwhite/70 md:text-base">{feature.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RITUAL */}
      <section className="section">
        <div className="container grid gap-10 md:grid-cols-[1fr,1.1fr]">
          <div className="space-y-6">
            <TextReveal text="The BloodThirst Ritual" as="h2" className="h2" />
            <Reveal delay={0.05}>
              <p className="p">
                This is more than hydration — it&apos;s a ceremony. Elevate your pre-game, your recovery, or your midnight grind
                with a ritual that celebrates rebellion and sustainability in equal measure.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <Link href="/bloodverse" className="nav-link inline-flex items-center text-sm font-medium text-bone hover:text-blood">
                Explore the Bloodverse →
              </Link>
            </Reveal>
          </div>

          <div className="grid gap-4">
            {ritualSteps.map((step, index) => (
              <Reveal key={step.title} delay={0.08 * index}>
                <div className="glass-panel flex gap-4 border border-blood/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blood/15 text-blood font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-offwhite md:text-lg">{step.title}</h3>
                    <p className="mt-2 text-sm text-offwhite/70 md:text-base">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — Infinite marquee */}
      <section className="section">
        <div className="container space-y-10">
          <div className="max-w-xl">
            <TextReveal text="Whispers from the coven" as="h2" className="h2" />
            <Reveal delay={0.05}>
              <p className="p mt-3">
                BloodThirst travels with artists, mixologists, and creators who thrive after dark. Here&apos;s what they&apos;re saying.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-10">
          <Marquee speed={40} pauseOnHover>
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="glass-panel w-[340px] shrink-0 md:w-[400px]"
              >
                <blockquote className="text-sm text-offwhite/80 md:text-base">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 text-sm uppercase tracking-wide text-bone/70">
                  <span className="block font-semibold text-offwhite">{t.name}</span>
                  <span>{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </Marquee>
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <section className="section" id="subscribe">
        <div className="container relative">
          <div className="absolute inset-x-0 -top-10 mx-auto h-40 max-w-3xl rounded-full bg-blood/20 blur-3xl" />
          <Reveal>
            <div className="glass-panel mx-auto max-w-3xl text-center">
              <TextReveal text="Join the Unholy circle" as="h2" className="h2" />
              <p className="p mt-3">Drops, perks, and first taste. No spam — just your new favorite ritual.</p>

              <form
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2"
                action={process.env.NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT || "#"}
                method="post"
              >
                <input type="hidden" name="source" value="homepage" />
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="you@domain"
                  className="flex-1 rounded-xl border border-ash bg-ash/40 px-4 py-3 text-sm text-offwhite outline-none transition focus:border-blood focus:ring-2 focus:ring-blood/40"
                />
                <MagneticButton strength={0.2}>
                  <button className="btn btn-primary w-full sm:w-auto" type="submit">
                    Stay Unholy
                  </button>
                </MagneticButton>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
