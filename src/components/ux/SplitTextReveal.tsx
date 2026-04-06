"use client"

import React, { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/*
  SplitTextReveal — each character slides up from behind a mask
  with staggered timing. The text looks like it's being physically
  manufactured on screen. Triggered on scroll into view.
*/

interface SplitTextRevealProps {
  text: string
  as?: keyof React.JSX.IntrinsicElements
  className?: string
  stagger?: number    // seconds between each char
  duration?: number   // animation duration per char
  delay?: number      // initial delay
  scrub?: boolean     // tie to scroll position instead of trigger-once
}

export function SplitTextReveal({
  text,
  as: Tag = "h2",
  className = "",
  stagger = 0.03,
  duration = 0.8,
  delay = 0,
  scrub = false,
}: SplitTextRevealProps) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Check reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Get all the char spans
    const chars = el.querySelectorAll<HTMLSpanElement>(".split-char")
    if (!chars.length) return

    // Set initial state
    gsap.set(chars, { y: "110%", opacity: 0 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        end: scrub ? "top 30%" : undefined,
        scrub: scrub ? 1 : false,
        once: !scrub,
      },
      delay,
    })

    tl.to(chars, {
      y: "0%",
      opacity: 1,
      duration,
      stagger,
      ease: "power3.out",
    })

    return () => {
      // Kill the ScrollTrigger instance first (if attached), then the timeline
      if (tl.scrollTrigger) {
        tl.scrollTrigger.kill()
      }
      tl.kill()
    }
  }, [text, stagger, duration, delay, scrub])

  // Split text into words, then chars, preserving spaces
  const words = text.split(" ")

  const Component = Tag as any

  return (
    <Component ref={containerRef} className={`${className} split-text-container`}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block" style={{ whiteSpace: "nowrap" }}>
          {word.split("").map((char, ci) => (
            <span
              key={`${wi}-${ci}`}
              className="split-char-wrap inline-block overflow-hidden"
            >
              <span className="split-char inline-block will-change-transform">
                {char}
              </span>
            </span>
          ))}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Component>
  )
}
