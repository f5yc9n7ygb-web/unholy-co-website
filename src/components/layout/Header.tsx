'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

/**
 * The header component for the website.
 * It features a sticky navigation bar that changes appearance on scroll.
 * Includes the brand logo, navigation links, and a call-to-action button.
 *
 * @returns {JSX.Element} The rendered header.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`sticky top-0 z-50 transition backdrop-blur ${scrolled ? 'bg-black/60' : 'bg-transparent'}`}>
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          <span className="text-bone">UNHOLY</span> <span className="text-blood">CO</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm">
          <Link href="/bloodthirst">BloodThirst</Link>
          <Link href="/drops">Drops</Link>
          <Link href="/story">Story</Link>
          <Link href="/bloodverse">Bloodverse</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <a href="#subscribe" className="btn btn-primary">Stay Unholy</a>
      </div>
    </header>
  )
}
