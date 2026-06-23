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

/** Section header used across the page — kicker + Cinzel poster title. */
export function SectionTitle({
  kicker,
  title,
  className = "",
}: {
  kicker: string
  title: ReactNode
  className?: string
}) {
  return (
    <header className={`mb-10 md:mb-14 ${className}`}>
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-4 font-cinzel text-[clamp(1.9rem,5.5vw,3.4rem)] font-black uppercase leading-[1.02] tracking-[-0.01em] text-offwhite">
        {title}
      </h2>
    </header>
  )
}
