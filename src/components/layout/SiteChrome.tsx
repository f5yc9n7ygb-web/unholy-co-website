"use client"

import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { InitiationPopup } from "@/components/ux/InitiationPopup"

// Routes that render without the site header + footer (client-side navigation)
const STANDALONE = ["/teaser"]

interface SiteChromeProps {
  children: ReactNode
  /**
   * True when the request originated from theunholy.co (set by middleware).
   * We pass this as a server-side prop because usePathname() returns the
   * browser URL ("/"), not the rewritten path ("/teaser"), after a middleware
   * rewrite — so we can't rely on pathname alone for domain-based routing.
   */
  isTeaserDomain?: boolean
}

export function SiteChrome({ children, isTeaserDomain = false }: SiteChromeProps) {
  const pathname = usePathname()

  // Standalone if: served via theunholy.co (domain flag) OR direct /teaser URL
  const standalone =
    isTeaserDomain ||
    STANDALONE.some((r) => pathname === r || pathname.startsWith(r + "/"))

  return (
    <>
      {!standalone && <Header />}
      <main className={standalone ? "isolate" : "pt-20 md:pt-24 isolate"}>
        {children}
      </main>
      {!standalone && <Footer />}
      {!standalone && <InitiationPopup />}
    </>
  )
}
