"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"
import { trackPixel } from "@/lib/meta-pixel"

/**
 * Promote a `?fbclid=` URL param into the `_fbc` cookie so server-side CAPI
 * has a stable click attribution token even when Meta's pixel script hasn't
 * yet auto-set the cookie (or is blocked by the user's browser).
 *
 * Format per Meta spec: `fb.<subdomain-index>.<unix-timestamp-seconds>.<fbclid>`.
 * We use subdomain-index `1` (apex domain). 90-day TTL matches Meta default.
 *
 * Always overwrites when the URL carries an `fbclid` — the URL value is by
 * definition the freshest click ID, and Meta's own Pixel script behaves the
 * same way. Skipping the overwrite would let a stale prior fbclid linger for
 * up to 90 days and misattribute the conversion.
 */
function captureFbclidToCookie() {
  if (typeof window === "undefined" || typeof document === "undefined") return
  try {
    const fbclid = new URL(window.location.href).searchParams.get("fbclid")
    if (!fbclid) return
    const value = `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}`
    const maxAge = 60 * 60 * 24 * 90 // 90 days
    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `_fbc=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
  } catch {
    /* never let attribution code break the page */
  }
}

/**
 * Meta Pixel (Facebook Pixel) provider.
 *
 * Loads the pixel base code once (gated by NEXT_PUBLIC_META_PIXEL_ID) and
 * fires a PageView on every App Router navigation. Additional standard events
 * are fired from the relevant components via `trackPixel()`.
 */
export function MetaPixelProvider({ children }: { children: ReactNode }) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const enabled = process.env.NODE_ENV === "production" && Boolean(pixelId)
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  // Run once on mount — independent of the pixel env var so attribution is
  // captured even if the Pixel itself is blocked.
  useEffect(() => {
    captureFbclidToCookie()
  }, [])

  useEffect(() => {
    if (!enabled || !pixelId) return
    if (!pathname || pathname === lastPath.current) return
    // Skip the very first pageview — the base code below fires it via fbq("track", "PageView").
    if (lastPath.current === null) {
      lastPath.current = pathname
      return
    }
    lastPath.current = pathname
    trackPixel("PageView")
  }, [enabled, pathname, pixelId])

  if (!enabled || !pixelId) return <>{children}</>

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
      {children}
    </>
  )
}
