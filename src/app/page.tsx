import HomeHero from "@/components/home/HomeHero"
import HomeShowcase from "@/components/home/Showcase"
import HomeManifesto from "@/components/home/Manifesto"
import HomeRitual from "@/components/home/HorizontalRitual"
import HomeCTA from "@/components/home/CTA"
import { Marquee } from "@/components/ux/Marquee"
import { InteractiveQuiz } from "@/components/ux/InteractiveQuiz"

export const revalidate = 60

const marqueeItems = [
  "BLOODTHIRST",
  "UNHOLY CO",
  "EST. MMXXV",
  "NOT YOUR SALVATION",
  "MINERAL WATER",
]

export default function HomePage() {
  return (
    <>
      <HomeHero />

      {/* Scrolling brand marquee divider */}
      <div className="py-5 border-y border-white/[0.04] overflow-hidden">
        <Marquee speed={25} pauseOnHover={false}>
          {marqueeItems.map((text) => (
            <span key={text} className="flex items-center gap-8 mx-8 shrink-0">
              <span className="text-bone/15 text-[10px] md:text-xs tracking-[0.35em] uppercase font-cinzel whitespace-nowrap">
                {text}
              </span>
              <span className="text-blood/25 text-[10px]">&diams;</span>
            </span>
          ))}
        </Marquee>
      </div>

      <HomeShowcase />
      <HomeManifesto />
      <HomeRitual />
      <section className="relative overflow-hidden bg-[#050505] py-20 md:py-32 border-t border-white/[0.04]">
        <div className="container px-4 sm:px-6">
          <InteractiveQuiz />
        </div>
      </section>
      <HomeCTA />
    </>
  )
}
