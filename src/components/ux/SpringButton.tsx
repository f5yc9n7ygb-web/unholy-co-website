"use client"

import { ReactNode, useRef } from "react"
import gsap from "gsap"

/*
  SpringButton — buttons that squish on press and spring back on release.
  Wraps any child element and adds tactile press physics.
  Uses GSAP for snappy, natural spring animations.
*/

interface SpringButtonProps {
  children: ReactNode
  className?: string
  scale?: number       // how much to squish (0.9 = 10% squish)
  magnetic?: boolean   // also attract toward cursor on hover
  magneticStrength?: number
}

export function SpringButton({
  children,
  className = "",
  scale = 0.96,
  magnetic = true,
  magneticStrength = 0.3,
}: SpringButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const boundsRef = useRef<DOMRect | null>(null)

  const handleMouseEnter = () => {
    if (!wrapperRef.current) return
    boundsRef.current = wrapperRef.current.getBoundingClientRect()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!magnetic || !wrapperRef.current || !boundsRef.current) return
    const bounds = boundsRef.current
    const x = (e.clientX - bounds.left - bounds.width / 2) * magneticStrength
    const y = (e.clientY - bounds.top - bounds.height / 2) * magneticStrength

    gsap.to(wrapperRef.current, {
      x,
      y,
      duration: 0.4,
      ease: "power2.out",
    })
  }

  const handleMouseLeave = () => {
    if (!wrapperRef.current) return
    gsap.to(wrapperRef.current, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.6,
      ease: "elastic.out(1, 0.4)",
    })
  }

  const handleMouseDown = () => {
    if (!wrapperRef.current) return
    gsap.to(wrapperRef.current, {
      scale,
      duration: 0.15,
      ease: "power2.in",
    })
  }

  const handleMouseUp = () => {
    if (!wrapperRef.current) return
    gsap.to(wrapperRef.current, {
      scale: 1,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    })
  }

  return (
    <div
      ref={wrapperRef}
      className={`inline-block ${className}`}
      style={{ willChange: "transform" }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
    </div>
  )
}
