import { TransitionLink } from "@/components/ux/TransitionLink"
import { COMPANY_SUPPORT_EMAIL } from "@/lib/site/company"
import { Instagram, Mail } from "lucide-react"

const NAV_LINKS = [
  { label: "BloodThirst", href: "/bloodthirst" },
  { label: "Drops",       href: "/drops"       },
  { label: "Story",       href: "/story"       },
  { label: "Bloodverse",  href: "/bloodverse"  },
  { label: "Shop",        href: "/shop"        },
  { label: "FAQ",          href: "/faq"         },
  { label: "Contact",     href: "/contact"     },
]

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-[#050505]">

      {/* Top blood-red border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-blood/50 to-transparent" />

      {/* Ambient glow behind big type */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(176,0,32,0.08),transparent)]" />

      {/* ── Big type ── */}
      <div className="container relative pt-16 pb-6 text-center md:pt-24">
        <p
          aria-hidden
          className="select-none font-cinzel font-black uppercase leading-none tracking-[0.12em] text-blood/[0.1]"
          style={{ fontSize: "clamp(2.8rem, 11vw, 9rem)" }}
        >
          Stay Unholy
        </p>
      </div>

      {/* Blood divider */}
      <div className="container">
        <div className="h-px bg-gradient-to-r from-transparent via-blood/25 to-transparent" />
      </div>

      {/* ── Main grid ── */}
      <div className="container grid gap-12 py-14 md:grid-cols-3 md:gap-8 lg:gap-16">

        {/* Brand */}
        <div className="space-y-5">
          <div className="font-cinzel text-base font-semibold tracking-[0.3em] uppercase">
            <span className="text-bone">UNHOLY</span>{" "}
            <span className="text-blood">CO.</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-offwhite/40">
            Gothic premium canned water. Mineral-rich, cold-forged, brutally refreshing.
            Engineered for those who thrive after dark.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://instagram.com/unholyco"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-ash/50 text-bone/40 transition-all hover:border-blood/50 hover:text-blood"
            >
              <Instagram size={15} />
            </a>
            <a
              href={`mailto:${COMPANY_SUPPORT_EMAIL}`}
              aria-label="Email"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-ash/50 text-bone/40 transition-all hover:border-blood/50 hover:text-blood"
            >
              <Mail size={15} />
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.4em] text-bone/25">Navigate</p>
          <nav className="space-y-2.5">
            {NAV_LINKS.map((link) => (
              <TransitionLink
                key={link.href}
                href={link.href}
                className="group flex items-center gap-2.5 text-sm text-offwhite/40 transition-colors hover:text-offwhite"
              >
                <span className="h-px w-3 shrink-0 bg-blood/30 transition-all duration-300 group-hover:w-5 group-hover:bg-blood" />
                {link.label}
              </TransitionLink>
            ))}
          </nav>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.4em] text-bone/25">Ritual Support</p>
          <div className="space-y-2.5">
            <a
              href={`mailto:${COMPANY_SUPPORT_EMAIL}`}
              className="block text-sm text-offwhite/40 transition-colors hover:text-blood"
            >
              {COMPANY_SUPPORT_EMAIL}
            </a>
            <TransitionLink
              href="/track"
              className="block text-sm text-offwhite/40 transition-colors hover:text-blood"
            >
              Track Order
            </TransitionLink>
            <TransitionLink
              href="/refund"
              className="block text-sm text-offwhite/40 transition-colors hover:text-blood"
            >
              Refunds &amp; Returns
            </TransitionLink>

            <p className="pt-1 text-xs text-offwhite/25">
              We reply fast after midnight.
            </p>
          </div>
        </div>
      </div>

      {/* Rune divider */}
      <div className="runes mx-8" />

      {/* ── Bottom bar ── */}
      <div className="container flex flex-col items-center justify-between gap-3 py-6 text-[11px] text-offwhite/25 sm:flex-row">
        <span>© {new Date().getFullYear()} UNHOLY CO. All rights reserved.</span>
        <div className="flex items-center gap-5">
          <TransitionLink href="/legal" className="transition-colors hover:text-offwhite/60">
            Legal
          </TransitionLink>
          <TransitionLink href="/contact" className="transition-colors hover:text-offwhite/60">
            Contact
          </TransitionLink>
        </div>
      </div>

    </footer>
  )
}
