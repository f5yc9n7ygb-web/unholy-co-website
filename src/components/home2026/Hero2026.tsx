import Image from "next/image"
import { TransitionLink } from "@/components/ux/TransitionLink"
import { HOME_HERO } from "@/content/home2026"

/**
 * 2026 hero — "the specimen breaks through the name".
 *
 * A type-collision stage: the same two-line BLOODTHIRST wordmark is rendered
 * twice in perfectly overlapping layers — solid fill BEHIND the can, hairline
 * outline IN FRONT of it — so the can reads as physically standing inside the
 * typography. Everything is CSS-only (animate-step-in entrances, the /sin
 * sin-breathe light pool and sin-sweep glint); no WebGL, no rAF loops, no
 * scroll-jacking. Reduced motion is handled by the global sin-* media query.
 */

// Both layers must produce identical layout for the collision to align, so the
// type block is one component parameterized only by paint style.
function CollisionType({ outline = false }: { outline?: boolean }) {
  const Tag = outline ? "div" : "h1"
  return (
    <Tag
      aria-hidden={outline || undefined}
      className="absolute inset-0 flex flex-col items-center justify-center text-center"
    >
      {HOME_HERO.headline.map((line, i) => (
        <span
          key={line}
          className="block font-cinzel text-[clamp(4.5rem,20vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.01em] opacity-0 animate-step-in md:text-[clamp(8rem,15vw,13rem)]"
          style={{
            animationDelay: `${0.15 + i * 0.12}s`,
            ...(outline
              ? { color: "transparent", WebkitTextStroke: "1.5px rgba(246,246,246,0.45)" }
              : { color: "#F6F6F6" }),
          }}
        >
          {line}
        </span>
      ))}
    </Tag>
  )
}

export default function Hero2026() {
  return (
    <section className="relative flex min-h-[calc(100svh-5rem)] flex-col overflow-hidden px-5 pb-6 pt-6 md:min-h-[calc(100svh-6rem)] md:px-10 md:pb-8">
      {/* ── Atmosphere: vignette pulls edges into shadow so the centre reads lit ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 42%, transparent 48%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ── Kicker ── */}
      <p
        className="relative z-10 flex items-center justify-center gap-4 opacity-0 animate-step-in"
        style={{ animationDelay: "0.1s" }}
      >
        <span aria-hidden className="h-px w-8 bg-blood/70 md:w-14" />
        <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.34em] text-bone/55 md:text-[10px] md:tracking-[0.4em]">
          {HOME_HERO.kicker}
        </span>
        <span aria-hidden className="h-px w-8 bg-blood/70 md:w-14" />
      </p>

      {/* ── Collision stage ── */}
      <div className="relative z-10 mx-auto h-[44svh] w-full max-w-6xl md:h-[52svh]">
        {/* light pool behind the can — breathe is opacity-only so it can never
            fight the centering transform (animations override class transforms) */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(176,0,32,0.18), rgba(176,0,32,0.05) 45%, transparent 72%)",
            animation: "home-breathe 7s ease-in-out infinite",
          }}
        />

        {/* fill layer of the wordmark (the real h1) */}
        <CollisionType />

        {/* scalpel line crossing the stage at the can's waist */}
        <div
          aria-hidden
          className="absolute left-0 top-[62%] h-px w-full origin-left bg-gradient-to-r from-transparent via-blood/70 to-transparent"
          style={{ animation: "sin-seam 1.1s 0.9s cubic-bezier(0.16,1,0.3,1) both" }}
        />

        {/* the specimen — centering lives on the wrapper, entrance animation on
            the img, because stepIn's transform would wipe the translate */}
        <div className="absolute left-1/2 top-1/2 z-[2] h-[104%] -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/can.webp"
            alt="BloodThirst — matte-black 500ml can of natural mineral water"
            width={848}
            height={1264}
            priority
            className="h-full w-auto max-w-none object-contain opacity-0 animate-step-in drop-shadow-[0_50px_90px_rgba(0,0,0,0.85)]"
            style={{ animationDelay: "0.4s" }}
          />
        </div>

        {/* outline layer of the wordmark, in front of the can */}
        <div className="absolute inset-0 z-[3] pointer-events-none">
          <CollisionType outline />
        </div>

        {/* slow cold-light glint travelling across the stage */}
        <div aria-hidden className="absolute inset-0 z-[4] overflow-hidden">
          <div
            className="absolute -inset-y-10 left-1/3 w-[22%] md:w-[14%]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(246,246,246,0.10) 50%, transparent)",
              filter: "blur(6px)",
              mixBlendMode: "screen",
              animation: "sin-sweep 10s cubic-bezier(0.4,0,0.2,1) 1.6s infinite",
            }}
          />
        </div>

        {/* ── Specimen annotations (lg+, decorative — facts repeat in THE RECORD) ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] hidden lg:block">
          {HOME_HERO.annotations.map((a, i) => (
            <div
              key={a.label}
              className={`absolute flex items-center gap-3 opacity-0 animate-step-in ${
                a.side === "left" ? "left-0" : "right-0 flex-row-reverse"
              }`}
              style={{ top: `${a.y}%`, animationDelay: `${1 + i * 0.14}s` }}
            >
              <span className={a.side === "left" ? "text-right" : "text-left"}>
                <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-offwhite/80">
                  {a.label}
                </span>
                <span className="block font-mono text-[8px] uppercase tracking-[0.24em] text-bone/45">
                  {a.note}
                </span>
              </span>
              <span
                className={`h-px w-12 xl:w-20 ${
                  a.side === "left"
                    ? "bg-gradient-to-r from-transparent via-bone/40 to-blood/80"
                    : "bg-gradient-to-l from-transparent via-bone/40 to-blood/80"
                }`}
              />
              <span className="h-1.5 w-1.5 rounded-full border border-blood/80 bg-blood/30" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Subject + CTAs ── */}
      <div className="relative z-10 mx-auto mt-6 flex w-full max-w-xl flex-col items-center text-center md:mt-8">
        <p
          className="text-[13px] leading-[1.55] text-bone/70 opacity-0 animate-step-in sm:text-sm md:text-[15px]"
          style={{ animationDelay: "0.55s" }}
        >
          {HOME_HERO.subject}
        </p>

        <div
          className="mt-6 flex w-full flex-col gap-3 opacity-0 animate-step-in sm:w-auto sm:flex-row sm:gap-4"
          style={{ animationDelay: "0.68s" }}
        >
          <TransitionLink
            href={HOME_HERO.ctaPrimaryHref}
            className="group inline-flex items-center justify-center gap-3 border border-blood bg-blood px-9 py-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-offwhite shadow-[0_18px_60px_-12px_rgba(176,0,32,0.7)] transition-colors duration-300 hover:bg-[#c4072a]"
          >
            {HOME_HERO.ctaPrimary}
            <span
              aria-hidden
              className="inline-block h-px w-5 bg-offwhite/70 transition-all duration-300 group-hover:w-9"
            />
          </TransitionLink>
          <TransitionLink
            href={HOME_HERO.ctaGhostHref}
            className="inline-flex items-center justify-center border border-bone/25 px-9 py-4 font-mono text-xs uppercase tracking-[0.3em] text-bone/75 transition-colors duration-300 hover:border-blood/70 hover:text-offwhite"
          >
            {HOME_HERO.ctaGhost}
          </TransitionLink>
        </div>
      </div>

      {/* ── Trust seam pinned to the bottom of the fold ── */}
      <div
        className="relative z-10 mt-auto pt-6 opacity-0 animate-step-in md:pt-8"
        style={{ animationDelay: "0.85s" }}
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-bone/15 pt-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blood/90">
            VERIFIED:
          </span>
          {HOME_HERO.trust.map((t) => (
            <span key={t} className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone/60">
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
