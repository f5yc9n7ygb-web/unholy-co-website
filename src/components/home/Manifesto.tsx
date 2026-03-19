import { SplitTextReveal } from "@/components/ux/SplitTextReveal"
import Reveal from "@/components/ux/Reveal"

const lines = [
  { text: "NOT", color: "text-offwhite/90", size: "text-[20vw] md:text-[14vw]" },
  { text: "FOR", color: "text-offwhite/90", size: "text-[20vw] md:text-[14vw]" },
  { text: "EVERYONE", color: "text-blood", size: "text-[11.5vw] md:text-[13vw]" },
]

export default function HomeManifesto() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden py-32 md:py-40">
      <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/[0.06] blur-[150px] pointer-events-none" />

      <div className="relative z-10 text-center">
        {lines.map((line, i) => (
          <SplitTextReveal
            key={line.text}
            text={line.text}
            as="div"
            className={`font-cinzel ${line.size} font-black leading-[0.9] tracking-tight ${line.color}`}
            stagger={0.04}
            delay={i * 0.18}
          />
        ))}

        <Reveal delay={0.6}>
          <p className="mt-8 text-[10px] uppercase tracking-[0.35em] text-bone/40 md:mt-10 md:text-xs">
            Forged for the few
          </p>
        </Reveal>
      </div>
    </section>
  )
}
