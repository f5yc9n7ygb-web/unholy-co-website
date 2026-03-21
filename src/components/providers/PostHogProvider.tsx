"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import * as Sentry from "@sentry/browser"
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
    // PostHog
    if (key) {
      posthog.init(key, {
        api_host: host,
        capture_pageview: false, // handled manually via PostHogPageView
        capture_pageleave: true,
        persistence: "localStorage",
      })
    }

    // Sentry
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (dsn) {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.01,
        integrations: [
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        ignoreErrors: [
          "ResizeObserver loop limit exceeded",
          "ResizeObserver loop completed with undelivered notifications",
          /^Non-Error promise rejection captured/,
        ],
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
