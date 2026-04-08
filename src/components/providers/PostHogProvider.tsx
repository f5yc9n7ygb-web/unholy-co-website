"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"

function PostHogPageView() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return
    lastPath.current = pathname
    posthog.capture("$pageview", {
      $current_url: window.location.href,
    })
  }, [pathname])

  return null
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

  useEffect(() => {
    if (key) {
      posthog.init(key, {
        api_host: host,
        capture_pageview: false, // handled manually via PostHogPageView
        capture_pageleave: true,
        persistence: "localStorage",
      })
    }
  }, [key, host])

  if (!key) return <>{children}</>

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  )
}
