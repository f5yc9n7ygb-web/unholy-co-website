"use client"

import { usePathname } from "next/navigation"
import { ReactNode, useEffect } from "react"

/**
 * Cinematic Page Transition — "Dark Curtain" reveal
 *
 * On every route change, `usePathname()` returns a new path, which changes
 * the `key` on the wrapper div, forcing React to unmount the old tree and
 * mount a fresh one. The fresh mount triggers the CSS `@keyframes` animations
 * defined in globals.css (.page-transition-curtain, .page-transition-content).
 *
 * Also scrolls to the top of the page on each navigation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  return (
    <div key={pathname}>
      {/* The Curtain: covers everything, then slides away */}
      <div className="page-transition-curtain" aria-hidden="true" />

      {/* The Content: fades up into view */}
      <div className="page-transition-content">
        {children}
      </div>
    </div>
  )
}
