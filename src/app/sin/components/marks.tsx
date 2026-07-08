import type { ReactNode } from "react"

/**
 * Shared visual primitives for the "Black Room" art direction.
 * Pure CSS, zero motion libraries — safe to use anywhere on the page.
 */

/** Mono micro-label with a short blood seam in front of it. */
export function Kicker({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-bone/55 ${className}`}
    >
      <span aria-hidden className="h-px w-7 bg-blood/80" />
      {children}
    </span>
  )
}

/** Hairline rule — blood fading into nothing, used as a scalpel-thin divider. */
export function Hairline({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block h-px w-full bg-gradient-to-r from-blood/50 via-bone/15 to-transparent ${className}`}
    />
  )
}

/**
 * Section header used across the page — kicker + Cinzel poster title.
 * `index` stamps a huge outlined case-file numeral behind the title, turning
 * the scroll into an evidence sequence; `subtitle` renders the muted deck line.
 */
export function SectionTitle({
  kicker,
  title,
  index,
  subtitle,
  className = "",
}: {
  kicker: string
  title: ReactNode
  index?: string
  subtitle?: ReactNode
  className?: string
}) {
  return (
    <header className={`relative mb-10 md:mb-14 ${className}`}>
      {index && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-6 right-0 select-none font-cinzel text-[5.5rem] font-black leading-none text-transparent md:-top-10 md:text-[9rem]"
          style={{ WebkitTextStroke: "1px rgba(201,201,201,0.09)" }}
        >
          {index}
        </span>
      )}
      <Kicker>{kicker}</Kicker>
      <h2 className="relative mt-4 font-cinzel text-[clamp(1.9rem,5.5vw,3.4rem)] font-black uppercase leading-[1.02] tracking-[-0.01em] text-offwhite">
        {title}
      </h2>
      {subtitle && (
        <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-bone/60 md:text-base">
          {subtitle}
        </p>
      )}
    </header>
  )
}
