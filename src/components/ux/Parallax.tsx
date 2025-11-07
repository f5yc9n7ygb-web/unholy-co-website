"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ReactNode, useRef } from "react"

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