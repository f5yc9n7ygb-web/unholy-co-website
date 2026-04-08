"use client"

import { MotionValue, motion, useTransform, useSpring, transform } from "framer-motion"

export function ScrollCountUp({
  progress,
  value,
  className = ""
}: {
  progress: MotionValue<number>
  value: string
  className?: string
}) {
  // Extract the numeric part (allowing commas and decimals) and the suffix (e.g. " trace elements", " avg.")
  const match = value.match(/([0-9,.]+)(.*)/)
  const numericPart = match ? parseFloat(match[1].replace(/,/g, "")) : 0
  const suffix = match ? match[2] : ""

  const smoothProgress = useSpring(progress, { damping: 30, stiffness: 200 })

  // Map the 0-1 progress to the numeric target
  const numericValue = useTransform(smoothProgress, (v) => transform(v, [0, 0.5], [0, numericPart]))
  
  const formattedValue = useTransform(numericValue, (latest) => {
    const hasDecimals = value.includes(".")
    return (hasDecimals ? latest.toFixed(1) : Math.round(latest).toString()) + suffix
  })

  return <motion.span className={className}>{formattedValue}</motion.span>
}
