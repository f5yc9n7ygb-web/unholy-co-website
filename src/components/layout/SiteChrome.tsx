"use client"

import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import { Header } from "./Header"
import { Footer } from "./Footer"

// Routes that render without the site header + footer
const STANDALONE = ["/teaser"]

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const standalone = STANDALONE.some((r) => pathname === r || pathname.startsWith(r + "/"))

  return (
    <>
      {!standalone && <Header />}
      <main className={standalone ? "isolate" : "pt-20 md:pt-24 isolate"}>
        {children}
      </main>
      {!standalone && <Footer />}
    </>
  )
}
