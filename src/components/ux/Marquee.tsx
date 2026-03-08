"use client"

import { ReactNode, useRef, useState } from "react"

type MarqueeProps = {
  children: ReactNode
  speed?: number
  pauseOnHover?: boolean
  className?: string
}

export function Marquee({ children, speed = 30, pauseOnHover = true, className = "" }: MarqueeProps) {
  const [paused, setPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className={`marquee-container overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <div
        className="marquee-track flex gap-6"
        style={{
          animationDuration: `${speed}s`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        <div className="marquee-content flex shrink-0 gap-6">{children}</div>
        <div className="marquee-content flex shrink-0 gap-6" aria-hidden>{children}</div>
      </div>
    </div>
  )
}
