"use client"

import { usePathname } from "next/navigation"
import { ReactNode, useEffect } from "react"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { InitiationPopup } from "@/components/ux/InitiationPopup"

// Routes that render without the site header + footer (client-side navigation)
const STANDALONE = ["/teaser", "/bloodthirst-shop", "/buy", "/sin", "/shop"]

interface SiteChromeProps {
  children: ReactNode
}

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  const standalone = STANDALONE.some((r) => pathname === r || pathname.startsWith(r + "/"))
  const suppressInitiationPopup =
    pathname === "/shop" ||
    pathname.startsWith("/shop/") ||
    pathname === "/thanks" ||
    pathname.startsWith("/thanks/") ||
    pathname === "/shop_CD_test"

  return (
    <>
      {!standalone && <Header />}
      <main
        key={pathname}
        className={`${standalone ? "isolate" : "pt-20 md:pt-24 isolate"} page-transition-content`}
      >
        {children}
      </main>
      {!standalone && <Footer />}
      {!standalone && !suppressInitiationPopup && <InitiationPopup />}
    </>
  )
}
