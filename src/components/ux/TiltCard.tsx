"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { ReactNode } from "react"

interface TiltCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function TiltCard({ children, className = "", onClick }: TiltCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ perspective: 1000 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative cursor-pointer ${className}`}
    >
      {/* Dynamic light glare effect based on mouse position could be added here */}
      <div 
        style={{ transform: "translateZ(30px)" }} 
        className="w-full h-full"
      >
        {children}
      </div>
    </motion.div>
  )
}
