"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ReactNode, useEffect, useRef, useState } from "react"

type RevealProps = {
  children: ReactNode
  delay?: number
}

/**
 * A component that reveals its children with a fade-in and slide-up animation
 * when it becomes visible in the viewport. It respects the user's preference for reduced motion.
 *
 * @param {RevealProps} props - The props for the component.
 * @param {ReactNode} props.children - The content to be animated.
 * @param {number} [props.delay=0] - The delay in seconds before the animation starts.
 * @returns {JSX.Element} The rendered motion div with the reveal effect.
 */
export default function Reveal({ children, delay = 0 }: RevealProps) {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion) return
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.25 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  if (prefersReducedMotion) {
    return <div ref={ref}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}
