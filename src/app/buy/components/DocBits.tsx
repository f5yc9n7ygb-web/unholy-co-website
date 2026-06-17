"use client"

import { useState, type ReactNode } from "react"
import { FILE_CHROME } from "@/content/bloodthirst-buy"

/**
 * Document primitives for the "cursed file" art direction.
 * Everything here is static CSS — no motion, no observers. The document
 * doesn't perform; it just sits there, looking official and wrong.
 */

/** Rubber stamp — blood ink, slightly rotated, edges fading like a real impression */
export function Stamp({
  children,
  className = "",
  rotate = -7,
}: {
  children: ReactNode
  className?: string
  rotate?: number
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none inline-block select-none border-[2.5px] border-blood/85 px-3 py-1.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.2em] text-blood md:text-xs ${className}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        // uneven ink take-up at the edges
        maskImage:
          "radial-gradient(130% 110% at 48% 52%, black 55%, rgba(0,0,0,0.62) 100%)",
        WebkitMaskImage:
          "radial-gradient(130% 110% at 48% 52%, black 55%, rgba(0,0,0,0.62) 100%)",
      }}
    >
      {children}
    </span>
  )
}

/** Ruled section header — "SECTION 02 — ACQUISITION" with file page number */
export function SectionHead({
  no,
  title,
  pageOf = "07",
}: {
  no: string
  title: string
  pageOf?: string
}) {
  return (
    <header className="mb-8 md:mb-10">
      <div className="flex items-baseline justify-between gap-4 border-b border-bone/25 pb-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-bone/60">
        <span>Section {no}</span>
        <span aria-hidden>
          PG {no} / {pageOf}
        </span>
      </div>
      <h2 className="mt-3 font-cinzel text-[clamp(1.7rem,5vw,3rem)] font-black uppercase leading-[1.02] text-offwhite">
        {title}
      </h2>
    </header>
  )
}

/** Redacted text — blood bar, tap to reveal. Keyboard and screen-reader safe. */
export function Redacted({ children }: { children: string }) {
  const [open, setOpen] = useState(false)
  if (open) {
    return <span className="font-bold text-blood">{children}</span>
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Redacted — tap to reveal"
      className="inline-block min-w-[5ch] cursor-pointer select-none bg-blood/85 px-1 align-baseline text-transparent transition-colors hover:bg-blood focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-blood"
    >
      {children}
    </button>
  )
}

/** Decorative barcode — pure CSS stripes, deliberately not scannable */
export function Barcode({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex flex-col items-center gap-1.5 ${className}`} aria-hidden>
      <div
        className="h-9 w-36 opacity-55"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #C9C9C9 0 2px, transparent 2px 5px, #C9C9C9 5px 6px, transparent 6px 11px, #C9C9C9 11px 14px, transparent 14px 17px)",
        }}
      />
      <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-bone/40">
        {FILE_CHROME.barcodeCaption}
      </span>
    </div>
  )
}

/** Faint ruled-paper background for ledger-style sections */
export const RULED_BG = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent 0 31px, rgba(201,201,201,0.045) 31px 32px)",
} as const
