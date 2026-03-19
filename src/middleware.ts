import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Domain-based routing
 *
 * theunholy.co / www.theunholy.co  →  serves /teaser only (URL stays clean)
 * unholy-co-website.pages.dev      →  serves the full site
 *
 * We stamp a request header `x-teaser-domain: 1` on every request that
 * comes through theunholy.co so that the server-side RootLayout can read it
 * and pass `isTeaserDomain={true}` to SiteChrome — bypassing the
 * usePathname() limitation (which returns "/" not "/teaser" after a rewrite).
 */

const TEASER_DOMAINS = ["theunholy.co", "www.theunholy.co"]

export function middleware(request: NextRequest) {
  const host     = request.headers.get("host") ?? ""
  const hostname = host.split(":")[0] // strip port (relevant in local dev)
  const { pathname } = request.nextUrl

  if (TEASER_DOMAINS.includes(hostname)) {
    // ── Always pass these through untouched ───────────────────────────────────
    if (pathname.startsWith("/_next/")) return NextResponse.next()
    if (/\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|map)$/i.test(pathname)) {
      return NextResponse.next()
    }

    // Stamp the teaser-domain header on ALL requests from theunholy.co so
    // the server layout can detect it regardless of the rewritten path.
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-teaser-domain", "1")

    // API routes: allow through (form submissions, email confirms, etc.)
    if (pathname.startsWith("/api/")) {
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    // Already at /teaser — just forward the header, no rewrite needed
    if (pathname === "/teaser") {
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    // ── Rewrite everything else → /teaser ────────────────────────────────────
    // Browser URL stays as theunholy.co — no visible redirect
    const url = request.nextUrl.clone()
    url.pathname = "/teaser"
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
