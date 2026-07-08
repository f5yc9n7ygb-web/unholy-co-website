import { SplitTextReveal } from "@/components/ux/SplitTextReveal"
import Reveal from "@/components/ux/Reveal"
import { HOME_MANIFESTO } from "@/content/home2026"

/**
 * The manifesto survives the overhaul — giant type held up fine. 2026 pass:
 * tighter leading, a scalpel seam under EVERYONE instead of a glow orb, and an
 * archival ink stamp to close, replacing the plain caption.
 */
export default function Manifesto2026() {
  const last = HOME_MANIFESTO.lines.length - 1
  return (
    <section className="relative z-10 flex min-h-[80svh] items-center justify-center overflow-hidden px-5 py-28 md:py-36">
      {/* faint blood pool, pulled far down so the type stays on matte black */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood/[0.05] blur-[140px]"
      />

      <div className="relative z-10 text-center">
        {HOME_MANIFESTO.lines.map((line, i) => (
          <div key={line} className="relative">
            <SplitTextReveal
              text={line}
              as="div"
              className={`font-cinzel font-black uppercase leading-[0.88] tracking-tight ${
                i === last
                  ? "text-[13vw] text-blood md:text-[12vw]"
                  : "text-[19vw] text-offwhite/90 md:text-[13vw]"
              }`}
              stagger={0.04}
              delay={i * 0.16}
            />
            {i === last && (
              <span
                aria-hidden
                className="absolute -bottom-2 left-[14%] h-[3px] w-[72%] origin-left bg-blood/80 md:-bottom-3"
                style={{ animation: "sin-seam 0.8s 0.9s cubic-bezier(0.16,1,0.3,1) both" }}
              />
            )}
          </div>
        ))}

        <Reveal delay={0.5}>
          <p className="mt-10 inline-block -rotate-2 border border-blood/40 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.34em] text-blood/80 md:mt-12 md:text-[10px]">
            {HOME_MANIFESTO.stamp}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
