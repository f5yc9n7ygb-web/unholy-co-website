"use client"

import { useEffect } from "react"

/*
  ClickRipple — global click effect.
  Every click anywhere on the page creates an expanding
  blood-red ring that fades out. Pure CSS animation,
  injected via JS event listener. Zero dependencies.
*/

export function ClickRipple() {
  useEffect(() => {
    // Only on pointer devices
    if (window.matchMedia("(pointer: coarse)").matches) return

    const handleClick = (e: MouseEvent) => {
      const ripple = document.createElement("div")
      ripple.className = "click-ripple"
      ripple.style.left = `${e.clientX}px`
      ripple.style.top = `${e.clientY}px`
      document.body.appendChild(ripple)

      // Clean up after animation
      ripple.addEventListener("animationend", () => {
        ripple.remove()
      })
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return null
}
