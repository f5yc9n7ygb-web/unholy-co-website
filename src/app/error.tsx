"use client"

import { useEffect } from "react"
import Link from "next/link"
import * as Sentry from "@sentry/browser"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Blood atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, rgba(176,0,32,0.10), transparent 70%)",
        }}
      />

      <div className="relative z-10 space-y-6 max-w-xl">
        <span className="badge border-blood/40 bg-blood/10 text-bone/80 uppercase tracking-[0.35em]">
          Something went wrong
        </span>

        <h1 className="h1">The ritual failed</h1>

        <p className="p max-w-md mx-auto">
          An unholy error interrupted the ceremony. This has been noted. Try
          again — or return to the altar and start fresh.
        </p>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <button onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/" className="btn btn-ghost">
            Return to the altar
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs text-offwhite/30 font-mono pt-2">
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
