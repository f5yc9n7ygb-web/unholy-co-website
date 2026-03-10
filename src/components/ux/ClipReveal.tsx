"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

export function ClipReveal({
  children,
  className = "",
  delay = 0,
  direction = "up"
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right"
}) {
  const getClipPath = () => {
    switch (direction) {
      case "up": return "inset(100% 0 0 0)"
      case "down": return "inset(0 0 100% 0)"
      case "left": return "inset(0 0 0 100%)"
      case "right": return "inset(0 100% 0 0)"
      default: return "inset(100% 0 0 0)"
    }
  }

  return (
    <motion.div
      className={className}
      initial={{ clipPath: getClipPath() }}
      whileInView={{ clipPath: "inset(0 0 0 0)" }}
      viewport={{ once: true, amount: "some" }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.16, 1, 0.3, 1] // Custom cinematic expo ease
      }}
    >
      {children}
    </motion.div>
  )
}
