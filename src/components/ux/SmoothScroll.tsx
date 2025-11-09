"use client"
import { useEffect } from "react"
import Lenis from "lenis"

/**
 * A client-side component that implements smooth scrolling for the entire page.
 * It uses the `lenis` library to create a more fluid and pleasant scrolling experience.
 * This component does not render any visible UI.
 *
 * @returns {null} This component returns null as it only contains a side effect.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,     // smoothness
      smoothWheel: true  // trackpad/mouse wheel
    })

    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return null
}
