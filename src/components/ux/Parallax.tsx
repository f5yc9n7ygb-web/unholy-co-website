"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ReactNode, useRef } from "react"

/**
 * A component that creates a parallax scrolling effect on its children.
 * It uses `framer-motion` to transform the vertical position of the content based on scroll progress.
 *
 * @param {object} props - The props for the component.
 * @param {ReactNode} props.children - The content to be animated.
 * @param {number} [props.amt=50] - The amount (in pixels) of vertical movement in the parallax effect.
 * @returns {JSX.Element} The rendered motion div with the parallax effect.
 */
export default function Parallax({ children, amt = 50 }: { children: ReactNode; amt?: number }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [-amt, amt])

  return (
    <motion.div ref={ref} style={{ y }}>
      {children}
    </motion.div>
  )
}