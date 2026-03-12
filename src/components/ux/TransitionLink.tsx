"use client"

import { usePageTransition } from "@/context/TransitionContext"
import { type ReactNode, type MouseEvent } from "react"

type Props = {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

/**
 * Drop-in replacement for Next.js <Link> on internal routes.
 * Triggers the GSAP two-panel page transition before navigating.
 *
 * External links, anchor links, and modifier-key clicks pass through normally.
 */
export function TransitionLink({ href, children, className, onClick }: Props) {
  const { navigate } = usePageTransition()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Pass through: external URLs, anchors, or modifier-key clicks
    if (
      href.startsWith("http") ||
      href.startsWith("mailto") ||
      href.startsWith("tel") ||
      href.startsWith("#") ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      onClick?.()
      return
    }

    e.preventDefault()
    onClick?.()
    navigate(href)
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
