"use client"
import Link from "next/link"
import type { Route } from "next"
import { useState, useEffect } from "react"

const NAV_ITEMS: Array<{
  label: string
  href: Route
  eyebrow: string
  description: string
}> = [
  { label: "BloodThirst", href: "/bloodthirst" as Route, eyebrow: "Flagship elixir", description: "Matte-black cans. Obsidian finish. Ritual-grade hydration." },
  { label: "Drops", href: "/drops" as Route, eyebrow: "Limited runs", description: "Small-batch releases for night crawlers and back rooms." },
  { label: "Story", href: "/story" as Route, eyebrow: "Origin myth", description: "How BloodThirst was forged in neon glow and velvet darkness." },
  { label: "Bloodverse", href: "/bloodverse" as Route, eyebrow: "Immersive lore", description: "Audio-visual transmissions from the cult of hydration." },
  { label: "Contact", href: "/contact" as Route, eyebrow: "Summon us", description: "Partnerships, drops, and rituals. We reply fast after midnight." }
]

/**
 * The header component for the website.
 * It features a sticky navigation bar that changes appearance on scroll.
 * Includes the brand logo, navigation links, and a call-to-action button.
 *
 * @returns {JSX.Element} The rendered header.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.removeProperty("overflow")
      return
    }
    const close = () => setMenuOpen(false)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("resize", close)
    window.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.removeProperty("overflow")
      window.removeEventListener("resize", close)
      window.removeEventListener("keydown", handleKey)
    }
  }, [menuOpen])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[120] transition backdrop-blur ${scrolled ? "bg-black/70" : "bg-black/40"}`}>
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="relative z-50 text-xl font-semibold tracking-tight">
            <span className="text-bone">UNHOLY</span> <span className="text-blood">CO</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm">
            <HeaderLinks />
          </nav>
          <div className="flex items-center gap-3">
            <a href="#subscribe" className="btn btn-primary hidden sm:inline-flex">Stay Unholy</a>
            <button
              className="relative z-50 md:hidden rounded-xl border border-ash/60 bg-black/30 px-3 py-2 text-sm text-bone"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[110] md:hidden">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-0 pointer-events-none opacity-60" aria-hidden>
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(176,0,32,0.3),transparent_55%)]" />
          </div>
          
          <div className="absolute inset-0 z-10 flex flex-col text-offwhite">
            <div className="flex-1 overflow-y-auto px-4 pb-10 pt-24">
              <div className="mx-0 w-full max-w-none">
                <div className="w-full max-w-none rounded-3xl border border-ash/40 bg-black/80 backdrop-blur-sm p-6 shadow-[0_25px_120px_rgba(176,0,32,0.35)]">
                  <div className="mb-6 text-xs uppercase tracking-[0.3em] text-bone/70">
                    summon navigation
                  </div>
                  <div className="divide-y divide-ash/30">
                    {NAV_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full flex-col gap-2 py-4"
                      >
                        <span className="text-xs uppercase tracking-[0.4em] text-blood/80">{item.eyebrow}</span>
                        <span className="text-2xl font-semibold text-offwhite">{item.label}</span>
                        <span className="text-sm text-offwhite/70">{item.description}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="my-6 h-px bg-ash/30" />
                  <a
                    href="#subscribe"
                    className="btn btn-primary w-full py-3 text-base"
                    onClick={() => setMenuOpen(false)}
                  >
                    Stay Unholy
                  </a>
                </div>
                <div className="mt-6 w-full max-w-none rounded-2xl border border-ash/40 bg-black/75 backdrop-blur-sm p-4 text-sm text-offwhite/70">
                  Need help fast? <a className="text-blood underline" href="mailto:rituals@theunholy.co">rituals@theunholy.co</a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Header area overlay to clip scrolling content */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/95 via-black/90 to-transparent pointer-events-none z-30" />
        </div>
      )}
    </>
  )
}

function HeaderLinks({
  onNavigate,
  className = "flex gap-6 text-sm",
}: {
  onNavigate?: () => void
  className?: string
} = {}) {
  return (
    <div className={className}>
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} onClick={onNavigate}>
          {item.label}
        </Link>
      ))}
    </div>
  )
}
