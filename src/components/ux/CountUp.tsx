"use client"

import { useEffect, useRef, useState } from "react"

type CountUpProps = {
  value: string
  className?: string
}

export function CountUp({ value, className = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(value)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Reset animation when value prop changes
  useEffect(() => {
    setHasAnimated(false)
    setDisplay(value)
  }, [value])

  useEffect(() => {
    const node = ref.current
    if (!node || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, hasAnimated])

  const animate = () => {
    setHasAnimated(true)
    const match = value.match(/(\d[\d,.]*)/)
    if (!match) return

    const numStr = match[1]
    const target = parseFloat(numStr.replace(/,/g, ""))
    const prefix = value.slice(0, match.index!)
    const suffix = value.slice(match.index! + numStr.length)
    const hasDecimal = numStr.includes(".")
    const decimalPlaces = hasDecimal ? numStr.split(".")[1].length : 0
    const hasComma = numStr.includes(",")
    const duration = 1200
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      let current = target * eased

      let formatted: string
      if (hasDecimal) {
        formatted = current.toFixed(decimalPlaces)
      } else {
        const rounded = Math.round(current)
        formatted = hasComma ? rounded.toLocaleString() : String(rounded)
      }

      setDisplay(`${prefix}${formatted}${suffix}`)
      if (progress < 1) requestAnimationFrame(step)
    }

    setDisplay(`${prefix}0${suffix}`)
    requestAnimationFrame(step)
  }

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
