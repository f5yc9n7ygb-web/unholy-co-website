"use client"

import { useRef, useState, ReactNode, MouseEvent } from "react"

type MagneticButtonProps = {
  children: ReactNode
  className?: string
  strength?: number
  as?: "button" | "a"
  [key: string]: unknown
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.3,
  as = "button",
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMove = (e: MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * strength
    const y = (e.clientY - rect.top - rect.height / 2) * strength
    setPos({ x, y })
  }

  const handleLeave = () => setPos({ x: 0, y: 0 })

  return (
    <div
      ref={ref}
      role={as === "button" ? "button" : undefined}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        display: "inline-flex",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: pos.x === 0 ? "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)" : "transform 0.15s ease-out",
      }}
    >
      {children}
    </div>
  )
}
