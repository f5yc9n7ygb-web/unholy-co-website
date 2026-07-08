"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

/**
 * "RED MASS" visual primitives — hype-drop brutalism.
 *
 * The language: full-bleed black/blood slabs, Anton poster type, 2px borders,
 * HARD offset shadows (never soft glows), rotated sticker-stamps, halftone
 * dots and hazard stripes. Everything here is CSS-only; the sole JS is one
 * IntersectionObserver for the slam-in reveal.
 */

export const INK = "#050505"
export const BLOOD = "#B00020"

/* ── Slam: in-view reveal with a hard overshoot ─────────────────────────── */

export function Slam({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: "div" | "section" | "article" | "li" | "figure"
}) {
  const ref = useRef<HTMLElement>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setOn(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const Comp = Tag as any
  return (
    <Comp
      ref={ref}
      className={className}
      style={
        on
          ? { animation: `mass-slam 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms both` }
          : { opacity: 0 }
      }
    >
      {children}
    </Comp>
  )
}

/* ── Stamp: rotated sticker chip ────────────────────────────────────────── */

export function Stamp({
  children,
  tone = "paper",
  rotate = -3,
  className = "",
  pop = false,
}: {
  children: ReactNode
  /** paper: offwhite bg/black text · ink: black bg/red text · blood: red bg/black text */
  tone?: "paper" | "ink" | "blood"
  rotate?: number
  className?: string
  pop?: boolean
}) {
  const tones: Record<string, string> = {
    paper: "bg-offwhite text-[#050505] border-[#050505]",
    ink: "bg-[#050505] text-blood border-blood",
    blood: "bg-blood text-[#050505] border-[#050505]",
  }
  const style: CSSProperties = pop
    ? ({ "--mass-rot": `${rotate}deg`, animation: "mass-pop 0.45s 0.15s cubic-bezier(0.34,1.56,0.64,1) both" } as CSSProperties)
    : { transform: `rotate(${rotate}deg)` }
  return (
    <span
      className={`inline-block border-2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] ${tones[tone]} ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}

/* ── HardButton: the CTA language — flat fill, 2px border, offset shadow ── */

export function HardButton({
  children,
  onClick,
  tone = "blood",
  className = "",
  disabled,
  busy,
  big = false,
}: {
  children: ReactNode
  onClick?: () => void
  /** blood: red button (for black slabs) · ink: black button (for red slabs) · paper: offwhite */
  tone?: "blood" | "ink" | "paper"
  className?: string
  disabled?: boolean
  busy?: boolean
  big?: boolean
}) {
  const tones: Record<string, string> = {
    blood:
      "bg-blood text-offwhite border-offwhite shadow-[6px_6px_0_#F6F6F6] hover:shadow-[3px_3px_0_#F6F6F6] hover:translate-x-[3px] hover:translate-y-[3px]",
    ink:
      "bg-[#050505] text-offwhite border-[#050505] shadow-[6px_6px_0_rgba(5,5,5,0.45)] hover:shadow-[3px_3px_0_rgba(5,5,5,0.45)] hover:translate-x-[3px] hover:translate-y-[3px]",
    paper:
      "bg-offwhite text-[#050505] border-[#050505] shadow-[6px_6px_0_#B00020] hover:shadow-[3px_3px_0_#B00020] hover:translate-x-[3px] hover:translate-y-[3px]",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      className={`inline-flex items-center justify-center gap-3 border-2 font-anton uppercase tracking-[0.08em] transition-[transform,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offwhite active:translate-x-[6px] active:translate-y-[6px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${
        big ? "px-8 py-5 text-2xl md:text-3xl" : "px-6 py-3.5 text-lg"
      } ${tones[tone]} ${className}`}
    >
      {busy && <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />}
      {children}
    </button>
  )
}

/* ── SlabHead: stamp + poster title + optional sub ──────────────────────── */

export function SlabHead({
  stamp,
  title,
  sub,
  onBlood = false,
  className = "",
}: {
  stamp: string
  title: ReactNode
  sub?: ReactNode
  /** true when the slab background is blood red (flips ink colors) */
  onBlood?: boolean
  className?: string
}) {
  return (
    <header className={`mb-10 md:mb-14 ${className}`}>
      <Stamp tone={onBlood ? "ink" : "blood"} rotate={-2}>
        {stamp}
      </Stamp>
      <h2
        className={`mt-5 font-anton text-[clamp(2.6rem,9vw,5.5rem)] uppercase leading-[0.92] tracking-[0.01em] ${
          onBlood ? "text-[#050505]" : "text-offwhite"
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-4 max-w-xl font-mono text-xs uppercase leading-relaxed tracking-[0.14em] md:text-sm ${
            onBlood ? "text-[#050505]/75" : "text-bone/70"
          }`}
        >
          {sub}
        </p>
      )}
    </header>
  )
}

/* ── Ticker: infinite marquee band ──────────────────────────────────────── */

export function Ticker({
  items,
  tone = "blood",
  speed = 26,
  className = "",
}: {
  items: readonly string[]
  /** blood: red band/black text · paper: offwhite band/black text */
  tone?: "blood" | "paper"
  speed?: number
  className?: string
}) {
  const band = tone === "blood" ? "bg-blood text-[#050505]" : "bg-offwhite text-[#050505]"
  const row = (key: string, hidden?: boolean) => (
    <span key={key} aria-hidden={hidden} className="flex shrink-0 items-center">
      {items.map((item) => (
        <span key={`${key}-${item}`} className="flex shrink-0 items-center">
          <span className="px-4 font-anton text-lg uppercase tracking-[0.06em] md:px-6 md:text-xl">
            {item}
          </span>
          <span aria-hidden className="font-mono text-sm font-bold">
            ✕
          </span>
        </span>
      ))}
    </span>
  )
  return (
    <div
      className={`overflow-hidden border-y-2 border-[#050505] py-2.5 ${band} ${className}`}
      role="marquee"
      aria-label={items.join(" · ")}
    >
      <div className="flex w-max" style={{ animation: `mass-ticker ${speed}s linear infinite` }}>
        {row("a")}
        {row("b", true)}
      </div>
    </div>
  )
}

/* ── Textures ───────────────────────────────────────────────────────────── */

/** Halftone dot field — place inside a relative parent. */
export function Halftone({
  className = "",
  color = "rgba(176,0,32,0.35)",
  size = 14,
}: {
  className?: string
  color?: string
  size?: number
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{
        backgroundImage: `radial-gradient(${color} 1.5px, transparent 1.5px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  )
}

/** Hazard stripe seam — thin diagonal-striped divider band. */
export function Hazard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-4 w-full border-y-2 border-[#050505] ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, #B00020 0 14px, #050505 14px 28px)",
      }}
    />
  )
}
