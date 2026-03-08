"use client"

import { useEffect, useRef, useState } from "react"

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [hovering, setHovering] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const mouse = useRef({ x: -100, y: -100 })
  const ring = useRef({ x: -100, y: -100 })
  const raf = useRef<number>(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
    setIsTouchDevice(isTouch)
    if (isTouch) return

    const move = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }
    }

    const tick = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`
      }
      raf.current = requestAnimationFrame(tick)
    }

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("a, button, [role='button'], .glass-panel, .stat-card, input, textarea")) {
        setHovering(true)
      }
    }

    const handleOut = () => setHovering(false)
    const handleLeave = () => setHidden(true)
    const handleEnter = () => setHidden(false)

    window.addEventListener("mousemove", move)
    window.addEventListener("mouseover", handleOver)
    window.addEventListener("mouseout", handleOut)
    document.addEventListener("mouseleave", handleLeave)
    document.addEventListener("mouseenter", handleEnter)
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseover", handleOver)
      window.removeEventListener("mouseout", handleOut)
      document.removeEventListener("mouseleave", handleLeave)
      document.removeEventListener("mouseenter", handleEnter)
      cancelAnimationFrame(raf.current)
    }
  }, [isTouchDevice])

  if (isTouchDevice) return null

  return (
    <>
      <div
        ref={dotRef}
        className="custom-cursor-dot"
        style={{ opacity: hidden ? 0 : 1 }}
        aria-hidden
      />
      <div
        ref={ringRef}
        className="custom-cursor-ring"
        data-hovering={hovering || undefined}
        style={{ opacity: hidden ? 0 : 1 }}
        aria-hidden
      />
    </>
  )
}
