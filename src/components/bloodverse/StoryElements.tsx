"use client"

import { ReactNode, useEffect, useState } from "react"
import Link from "next/link"

/* ═══════════════════════════════════════════
   PROGRESS BAR — fixed at top, tracks scroll
   ═══════════════════════════════════════════ */
export function ChapterProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-black/50">
      <div
        className="h-full bg-gradient-to-r from-blood via-blood to-blood/40 transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════
   CHAPTER HERO — full viewport opening card
   ═══════════════════════════════════════════ */
interface ChapterHeroProps {
  chapterNumber: string
  title: string
  subtitle?: string
  timestamp?: string
}

export function ChapterHero({ chapterNumber, title, subtitle, timestamp }: ChapterHeroProps) {
  return (
    <div className="relative flex min-h-[100svh] items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blood/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative text-center space-y-6">
        <p className="ch-hero-fade text-xs uppercase tracking-[0.4em] text-blood/60" style={{ animationDelay: "0.3s" }}>
          Bloodverse &middot; Chapter {chapterNumber}
        </p>

        <h1 className="ch-hero-rise text-5xl md:text-7xl lg:text-8xl font-cinzel text-offwhite tracking-wide" style={{ animationDelay: "0.5s" }}>
          {title}
        </h1>

        {subtitle && (
          <p className="ch-hero-fade text-lg md:text-xl text-bone/40 italic max-w-lg mx-auto" style={{ animationDelay: "0.9s" }}>
            {subtitle}
          </p>
        )}

        {timestamp && (
          <div className="ch-hero-fade pt-4" style={{ animationDelay: "1.1s" }}>
            <span
              className="inline-block rounded-full border border-blood/20 bg-blood/5 px-5 py-2 text-xs uppercase tracking-[0.25em] text-blood/70 font-mono"
              dangerouslySetInnerHTML={{ __html: timestamp }}
            />
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="ch-hero-fade absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animationDelay: "1.5s" }}>
        <div className="flex flex-col items-center gap-2 animate-float">
          <span className="text-[10px] uppercase tracking-[0.3em] text-bone/30">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-bone/30 to-transparent" />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   SCENE — scroll-revealed story block
   ═══════════════════════════════════════════ */
type SceneVariant = "narration" | "dialogue" | "timestamp" | "artifact" | "reveal" | "centered" | "wide"

interface SceneProps {
  children: ReactNode
  variant?: SceneVariant
  delay?: number
  className?: string
}

const variantStyles: Record<SceneVariant, string> = {
  narration: "max-w-2xl mx-auto text-lg md:text-xl leading-relaxed text-bone/80",
  dialogue: "max-w-xl mx-auto text-center",
  timestamp: "max-w-lg mx-auto text-center",
  artifact: "max-w-2xl mx-auto",
  reveal: "max-w-3xl mx-auto text-center",
  centered: "max-w-xl mx-auto text-center",
  wide: "max-w-4xl mx-auto",
}

export function Scene({ children, variant = "narration", delay = 0, className = "" }: SceneProps) {
  return (
    <div className={`ch-scene-reveal py-6 md:py-12 px-4 ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════
   INTERACTIVE REVEAL — tap to show content
   ═══════════════════════════════════════════ */
interface InteractiveRevealProps {
  prompt: string
  children: ReactNode
  className?: string
}

export function InteractiveReveal({ prompt, children, className = "" }: InteractiveRevealProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className={className}>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="group relative mx-auto block rounded-xl border border-blood/30 bg-blood/5 px-8 py-4 text-sm uppercase tracking-[0.2em] text-blood/80 transition-all hover:border-blood/60 hover:bg-blood/10 hover:text-blood hover:shadow-[0_0_40px_rgba(176,0,32,0.15)]"
        >
          <span className="relative z-10 flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-blood/60 animate-pulse" />
            {prompt}
          </span>
        </button>
      ) : (
        <div className="animate-step-in">
          {children}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   REDACTED — blurred text, cleared on tap
   ═══════════════════════════════════════════ */
export function Redacted({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [cleared, setCleared] = useState(false)

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setCleared(true)}
      onKeyDown={(e) => e.key === "Enter" && setCleared(true)}
      className={`cursor-pointer transition-all duration-500 select-none ${
        cleared
          ? "blur-0 text-blood"
          : "blur-[5px] hover:blur-[3px] text-bone/60"
      } ${className}`}
      aria-label="Tap to reveal"
    >
      {children}
    </span>
  )
}

/* ═══════════════════════════════════════════
   DIALOGUE — stylized character speech
   ═══════════════════════════════════════════ */
export function Dialogue({ speaker, children, className = "" }: { speaker?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {speaker && (
        <p className="text-[10px] uppercase tracking-[0.3em] text-bone/30 font-mono">{speaker}</p>
      )}
      <p className="text-2xl md:text-3xl font-cinzel text-blood/90 italic leading-snug">
        &ldquo;{children}&rdquo;
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════
   TIMESTAMP — time & place marker
   ═══════════════════════════════════════════ */
export function Timestamp({ time, location }: { time: string; location?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-px bg-gradient-to-b from-transparent via-blood/40 to-transparent" />
      <div className="rounded-full border border-blood/20 bg-blood/5 px-5 py-2.5">
        <p className="text-xs uppercase tracking-[0.25em] text-blood/80 font-mono">{time}</p>
        {location && (
          <p className="text-[10px] uppercase tracking-[0.15em] text-bone/40 mt-1 text-center">{location}</p>
        )}
      </div>
      <div className="h-10 w-px bg-gradient-to-b from-transparent via-blood/40 to-transparent" />
    </div>
  )
}

/* ═══════════════════════════════════════════
   ARTIFACT — in-world evidence card
   ═══════════════════════════════════════════ */
export function Artifact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-blood/20 bg-black/60 backdrop-blur-md overflow-hidden shadow-[0_0_40px_rgba(176,0,32,0.08)]">
      <div className="border-b border-blood/15 px-5 py-3 bg-blood/5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-blood/70 font-mono flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blood/60 animate-pulse" />
          {label}
        </p>
      </div>
      <div className="p-5 text-sm text-bone/60 leading-relaxed font-mono space-y-1">
        {children}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   SEPARATOR — visual break between sections
   ═══════════════════════════════════════════ */
export function Separator() {
  return (
    <div className="flex justify-center py-4">
      <div className="flex items-center gap-3">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-blood/30" />
        <div className="h-1.5 w-1.5 rounded-full bg-blood/30" />
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-blood/30" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   CHAPTER END — closing section with CTA
   ═══════════════════════════════════════════ */
interface ChapterEndProps {
  nextChapter?: { number: number; title: string; href: string }
  message?: string
  finalMessage?: string
}

export function ChapterEnd({ nextChapter, message, finalMessage }: ChapterEndProps) {
  return (
    <div className="py-16 md:py-24 px-4 text-center space-y-8 max-w-2xl mx-auto">
      <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-blood to-transparent" />

      {message && (
        <p className="text-lg text-bone/50 italic">{message}</p>
      )}

      {nextChapter && (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-bone/30">Continue the myth</p>
          <Link
            href={nextChapter.href}
            className="group inline-flex flex-col items-center gap-2 rounded-2xl border border-blood/30 bg-blood/5 px-10 py-6 transition-all hover:border-blood/50 hover:bg-blood/10 hover:shadow-[0_0_60px_rgba(176,0,32,0.12)]"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-blood/50">
              Chapter {nextChapter.number}
            </span>
            <span className="text-xl md:text-2xl font-cinzel text-offwhite group-hover:text-blood transition-colors">
              {nextChapter.title}
            </span>
            <span className="text-xs text-bone/30 group-hover:text-bone/50 transition-colors mt-1">
              Enter &rarr;
            </span>
          </Link>
        </div>
      )}

      {finalMessage && (
        <p className="text-base text-bone/40 italic max-w-md mx-auto leading-relaxed pt-4">
          {finalMessage}
        </p>
      )}

      <div className="pt-8 flex flex-wrap justify-center gap-4">
        <Link href="/bloodverse" className="btn btn-ghost text-sm">
          &larr; The Vault
        </Link>
        <Link href="/drops" className="btn btn-primary text-sm">
          Get BloodThirst
        </Link>
      </div>
    </div>
  )
}
