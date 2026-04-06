"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import type { Route } from "next"
import gsap from "gsap"

type TransitionCtx = {
  navigate: (href: string) => void
}

const TransitionContext = createContext<TransitionCtx>({ navigate: () => {} })

export const usePageTransition = () => useContext(TransitionContext)

/**
 * TransitionProvider — Awwwards-style vertical curtain
 *
 * Cover:  Curtain rises from bottom (scaleY 0→1, origin bottom), brand wordmark
 *         fades in at peak, router.push fires on complete.
 * Reveal: Origin switches to top, curtain retracts upward (scaleY 1→0),
 *         wordmark fades out just before.
 *
 * Key details:
 *  - expo.inOut easing for that punchy, weighted feel
 *  - Blood-red gradient edge leads the curtain
 *  - UNHOLY CO. wordmark with letter-spacing entrance
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const curtainRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const isCovering = useRef(false)

  // Pathname changed → new page mounted → reveal
  useEffect(() => {
    if (!isCovering.current) return
    isCovering.current = false

    // One frame delay so new page has painted before we pull back the curtain
    gsap.delayedCall(0.04, () => {
      if (tl.current) tl.current.kill()
      tl.current = gsap.timeline()
        // Wordmark exits upward
        .to(wordmarkRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.18,
          ease: "power2.in",
        })
        // Switch origin to top so curtain retracts upward
        .set(curtainRef.current, { transformOrigin: "top center" })
        // Curtain pulls up
        .to(curtainRef.current, {
          scaleY: 0,
          duration: 0.55,
          ease: "expo.inOut",
        }, "-=0.08")
    })
  }, [pathname])

  // Use a ref to track pathname so the callback doesn't need it as a dependency
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const navigate = useCallback(
    (href: string) => {
      if (href === pathnameRef.current) return
      if (tl.current) tl.current.kill()

      // Reset state
      gsap.set(curtainRef.current, {
        scaleY: 0,
        transformOrigin: "bottom center",
      })
      gsap.set(wordmarkRef.current, { opacity: 0, y: 8 })

      isCovering.current = true

      tl.current = gsap.timeline({
        onComplete: () => router.push(href as Route),
      })
        // Curtain rises from bottom
        .to(curtainRef.current, {
          scaleY: 1,
          duration: 0.5,
          ease: "expo.inOut",
        })
        // Wordmark drifts up into view at peak
        .to(wordmarkRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.22,
          ease: "power2.out",
        }, "-=0.2")
    },
    [router]
  )

  return (
    <TransitionContext value={{ navigate }}>
      {children}

      <div
        aria-hidden
        style={{ position: "fixed", inset: 0, zIndex: 9990, pointerEvents: "none" }}
      >
        <div
          ref={curtainRef}
          style={{
            position: "absolute",
            inset: 0,
            background: "#080808",
            transform: "scaleY(0)",
            transformOrigin: "bottom center",
            willChange: "transform",
          }}
        >
          {/* Blood-red gradient edge — leads the rising curtain */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, transparent 0%, #B00020 15%, #B00020 85%, transparent 100%)",
            }}
          />

          {/* Brand logo + tagline — appears at peak coverage */}
          <div
            ref={wordmarkRef}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              opacity: 0,
            }}
          >
            <Image
              src="/uhc-logo.png"
              alt="UNHOLY CO."
              width={200}
              height={200}
              style={{ objectFit: "contain", mixBlendMode: "screen" }}
              priority
            />
            {/* Divider */}
            <div style={{
              width: "32px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, #B00020, transparent)",
            }} />
            {/* Tagline */}
            <span style={{
              color: "#C9C9C9",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "9px",
              fontWeight: 500,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}>
              Stay Unholy
            </span>
          </div>
        </div>
      </div>
    </TransitionContext>
  )
}
