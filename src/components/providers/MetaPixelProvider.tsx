"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"
import { trackPixel } from "@/lib/meta-pixel"

/**
 * Meta Pixel (Facebook Pixel) provider.
 *
 * Loads the pixel base code once (gated by NEXT_PUBLIC_META_PIXEL_ID) and
 * fires a PageView on every App Router navigation. Additional standard events
 * are fired from the relevant components via `trackPixel()`.
 */
export function MetaPixelProvider({ children }: { children: ReactNode }) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pixelId) return
    if (!pathname || pathname === lastPath.current) return
    // Skip the very first pageview — the base code below fires it via fbq("track", "PageView").
    if (lastPath.current === null) {
      lastPath.current = pathname
      return
    }
    lastPath.current = pathname
    trackPixel("PageView")
  }, [pathname, pixelId])

  if (!pixelId) return <>{children}</>

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        // eslint-disable-next-line react/no-danger
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
