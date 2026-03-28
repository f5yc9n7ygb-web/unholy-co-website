"use client"

import { useEffect, useRef, useState } from "react"

/*
  TextScramble — gothic matrix-style text decode effect.
  On hover (or on mount with `triggerOnView`), the text scrambles
  through random characters before resolving to the final string.
*/

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(){}[]|;:,.<>?/~`±§†‡¶•ªº¤÷×"

interface TextScrambleProps {
  text: string
  as?: keyof JSX.IntrinsicElements
  className?: string
  speed?: number          // ms per iteration
  revealDelay?: number    // ms before each char resolves
  triggerOnView?: boolean // auto-trigger when scrolled into view
  triggerOnHover?: boolean // trigger on hover (default true)
}

export function TextScramble({
  text,
  as: Tag = "span",
  className = "",
  speed = 30,
  revealDelay = 50,
  triggerOnView = false,
  triggerOnHover = true,
}: TextScrambleProps) {
  const [display, setDisplay] = useState(text)
  const elRef = useRef<HTMLElement>(null)
  const isScramblingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasViewTriggeredRef = useRef(false)

  const scramble = () => {
    if (isScramblingRef.current) return
    isScramblingRef.current = true

    const resolved = new Set<number>()
    let iteration = 0
    const length = text.length

    const tick = () => {
      // Every `revealDelay / speed` iterations, lock in the next character
      const resolvedCount = Math.floor((iteration * speed) / revealDelay)

      // Mark characters as resolved
      for (let i = 0; i < resolvedCount && i < length; i++) {
        resolved.add(i)
      }

      // Build display string
      const next = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " "
          if (resolved.has(i)) return text[i]
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join("")

      setDisplay(next)
      iteration++

      if (resolvedCount >= length) {
        setDisplay(text)
        isScramblingRef.current = false
        return
      }

      timerRef.current = setTimeout(tick, speed)
    }

    tick()
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Keep scramble ref current so the observer always calls the latest version
  const scrambleRef = useRef(scramble)
  scrambleRef.current = scramble

  // Trigger on scroll into view (fires once)
  useEffect(() => {
    if (!triggerOnView || !elRef.current) return

    const node = elRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasViewTriggeredRef.current) {
            hasViewTriggeredRef.current = true
            scrambleRef.current()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [triggerOnView, text])

  const Component = Tag as any

  return (
    <Component
      ref={elRef}
      className={className}
      onMouseEnter={triggerOnHover ? scramble : undefined}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {display}
    </Component>
  )
}
