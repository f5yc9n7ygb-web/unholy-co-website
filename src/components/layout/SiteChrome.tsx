"use client"

import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { InitiationPopup } from "@/components/ux/InitiationPopup"

// Routes that render without the site header + footer (client-side navigation)
const STANDALONE = ["/teaser", "/bloodthirst-shop"]

interface SiteChromeProps {
  children: ReactNode
}

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname()

  const standalone = STANDALONE.some((r) => pathname === r || pathname.startsWith(r + "/"))
  const suppressInitiationPopup =
    pathname === "/shop" ||
    pathname.startsWith("/shop/") ||
    pathname === "/shop_CD_test"

  return (
    <>
      {!standalone && <Header />}
      <main className={standalone ? "isolate" : "pt-20 md:pt-24 isolate"}>
        {children}
      </main>
      {!standalone && <Footer />}
      {!standalone && !suppressInitiationPopup && <InitiationPopup />}
    </>
  )
}
