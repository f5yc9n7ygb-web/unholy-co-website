import Link from 'next/link'

/**
 * The footer component for the website.
 * It includes navigation links, a subscription form, and copyright information.
 *
 * @returns {JSX.Element} The rendered footer.
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-ash/60">
      <div className="container py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="text-2xl font-semibold"><span className="text-bone">UNHOLY</span> <span className="text-blood">CO</span></div>
          <p className="p mt-2">Water for the damned thirsty.</p>
        </div>
        <nav className="grid gap-2">
          <Link href="/bloodthirst">BloodThirst</Link>
          <Link href="/drops">Drops</Link>
          <Link href="/story">Story</Link>
          <Link href="/legal">Legal</Link>
        </nav>
        <div>
          <p className="p">Join the circle</p>
          <form className="mt-3 flex gap-2" action={process.env.NEXT_PUBLIC_WORKER_ENDPOINT || "#"} method="post">
            <input type="hidden" name="source" value="footer" />
            <input required name="email" type="email" placeholder="you@domain" className="flex-1 bg-ash/40 border border-ash rounded-xl px-3 py-2 text-offwhite" />
            <button className="btn btn-primary" type="submit">Subscribe</button>
          </form>
          <p className="text-xs text-offwhite/60 mt-2">By subscribing you accept updates. Stay Unholy.</p>
        </div>
      </div>
      <div className="runes" />
      <div className="container py-6 text-xs text-offwhite/60">© {new Date().getFullYear()} UNHOLY CO.</div>
    </footer>
  )
}
