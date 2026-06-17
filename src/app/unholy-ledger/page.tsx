import type { Metadata } from "next"
import Link from "next/link"
import { Share2 } from "lucide-react"
import { getSupabasePublicLedgerEntries, type PublicLedgerEntry } from "@/lib/server/supabase"

export const metadata: Metadata = {
  title: "The Unholy Ledger - BloodThirst",
  description:
    "A public record of people who paid money for cursed hydration and lived to tell the tale.",
  alternates: { canonical: "/unholy-ledger" },
}

export const dynamic = "force-dynamic"

const LEDGER_ENTRIES = [
  {
    name: "Aakash",
    city: "Jaipur",
    date: "10 June 2026",
    pack: "Trial Ritual",
    confession: "I said I was just curious. I lied.",
  },
  {
    name: "@midnightdesk",
    city: "Mumbai",
    date: "10 June 2026",
    pack: "The Possession",
    confession: "The fridge looked too innocent.",
  },
  {
    name: "R.",
    city: "Delhi",
    date: "10 June 2026",
    pack: "Single Sin",
    confession: "Bought it for the story. Kept the can.",
  },
  {
    name: "@badwaterclub",
    city: "Bengaluru",
    date: "10 June 2026",
    pack: "Cult Supply",
    confession: "My desk needed a worse influence.",
  },
]

export default async function UnholyLedgerPage() {
  const liveEntries = await getSupabasePublicLedgerEntries().catch((err) => {
    console.error("Ledger lookup failed:", err)
    return [] as PublicLedgerEntry[]
  })
  const entries = liveEntries.length ? liveEntries : LEDGER_ENTRIES
  const showingExamples = liveEntries.length === 0

  return (
    <main className="min-h-screen bg-[#090909] text-bone">
      <div aria-hidden className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(176,0,32,0.18),transparent_34%),linear-gradient(180deg,#111_0%,#090909_52%,#050505_100%)]" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-10 md:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="font-cinzel text-sm font-black uppercase text-offwhite">
            UNHOLY CO.
          </Link>
          <Link href="/bloodthirst-shop" className="border border-blood/40 bg-blood/12 px-4 py-2 text-xs font-bold uppercase text-offwhite">
            Buy BloodThirst
          </Link>
        </header>

        <section className="pt-24 md:pt-32">
          <p className="text-xs font-bold uppercase text-blood">Public archive</p>
          <h1 className="mt-4 font-cinzel text-5xl font-black uppercase leading-none text-offwhite md:text-7xl">
            The Unholy Ledger
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone/68">
            A public record of people who paid money for cursed hydration and lived to tell the tale.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bone/48">
            Entries are shown only when a customer explicitly consents to public display of their chosen name or handle, city, and confession.
          </p>
        </section>

        <p className="mt-10 inline-flex border border-bone/15 bg-black/40 px-3 py-1 text-xs uppercase tracking-wide text-bone/55">
          {showingExamples ? "Example entries · Real sinners appear after launch" : "Live entries · Consent verified at checkout"}
        </p>
        <section className="mt-6 grid gap-3 md:grid-cols-2">
          {entries.map((entry) => (
            <article key={`${entry.name}-${entry.city}-${entry.date}-${entry.pack}`} className="border border-bone/12 bg-black/42 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-cinzel text-2xl font-black uppercase text-offwhite">
                    {entry.name} - {entry.city}
                  </h2>
                  <p className="mt-3 text-xs text-bone/45">Initiated: {entry.date}</p>
                  <p className="mt-1 text-xs text-bone/45">Pack: {entry.pack}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Share ${entry.name}'s ledger entry`}
                  className="border border-bone/12 p-2 text-bone/56 transition-colors hover:border-blood/45 hover:text-offwhite"
                >
                  <Share2 size={16} />
                </button>
              </div>
              <p className="mt-5 text-base leading-relaxed text-bone/68">&ldquo;{entry.confession}&rdquo;</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
