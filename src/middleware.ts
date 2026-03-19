import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Domain-based routing
 *
 * theunholy.co / www.theunholy.co  →  serves /teaser only (URL stays clean)
 * unholy-co-website.pages.dev      →  serves the full site
 *
 * API routes are always accessible on both domains so form submissions
 * and email confirmation links work regardless of which domain the user is on.
 */

const TEASER_DOMAINS = ["theunholy.co", "www.theunholy.co"]

export function middleware(request: NextRequest) {
  const host  = request.headers.get("host") ?? ""
  const hostname = host.split(":")[0] // strip port (relevant in dev)
  const { pathname } = request.nextUrl

  if (TEASER_DOMAINS.includes(hostname)) {
    // ── Always let these through ──────────────────────────────────────────────
    // API routes: contact, subscribe, order — must work from theunholy.co
    if (pathname.startsWith("/api/")) return NextResponse.next()

    // Next.js internals
    if (pathname.startsWith("/_next/")) return NextResponse.next()

    // Static assets in /public
    if (/\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|eot|css|js|map)$/i.test(pathname)) {
      return NextResponse.next()
    }

    // Already on /teaser — no rewrite needed
    if (pathname === "/teaser") return NextResponse.next()

    // ── Rewrite everything else → /teaser ────────────────────────────────────
    // URL in the browser stays as theunholy.co — no visible redirect
    const url = request.nextUrl.clone()
    url.pathname = "/teaser"
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next.js static chunks (avoids double-processing)
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
