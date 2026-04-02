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
    // Lenis smooth scroll is for mouse/trackpad only.
    // On touch devices (Android/iOS) native scroll physics are already smooth
    // and Lenis creates a desync with Framer Motion's useScroll — causing
    // scroll-driven animations (like the 3D can) to glitch.
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches
    if (isTouch) return

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
