"use client"

import { useEffect, type ReactNode } from "react"

/**
 * Next.js App Router template — re-mounted on every navigation.
 *
 * Scrolls to top and applies a subtle content-enter fade so the new
 * page content eases in gracefully after the GSAP transition panels clear.
 */
export default function Template({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  return (
    <div className="page-transition-content">
      {children}
    </div>
  )
}
