import Link from "next/link"
import { MicroHero } from "@/components/layout/MicroHero"
import { ContactForm } from "@/components/forms/ContactForm"

export const metadata = {
  title: "Contact — UNHOLY CO.",
  description: "Bookings, retail partnerships, press, or pure curiosity — reach the coven and we’ll respond within 24 hours."
}

const contactChannels = [
  { label: "Email", value: "rituals@theunholy.co", href: "mailto:rituals@theunholy.co" },
  { label: "WhatsApp Hotline", value: "+91 98 700 66 131", href: "https://wa.me/919870066131" },
  { label: "Press & Media", value: "press@theunholy.co", href: "mailto:press@theunholy.co" },
]

export default function ContactPage() {
  return (
    <div className="section">
      <div className="container space-y-12">
        <MicroHero
          eyebrow="SUMMON THE COVEN"
          title="Let’s collaborate, conspire, or craft a ritual."
          description="Bookings, retail partnerships, sonic collaborations, press requests — whatever you’re plotting, drop it here. We respond within 24 hours."
          actions={[
            { label: "View Drops", href: "/drops", variant: "ghost" },
            { label: "Follow the Bloodverse", href: "/bloodverse", variant: "ghost" },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <div className="glass-panel space-y-4">
              <h2 className="h2">Talk to a human, not a bot</h2>
              <p className="text-sm text-offwhite/70">
                Our team lives for late-night launches and off-kilter ideas. Reach out for partnerships, corporate gifting, event
                supply, or to bring BloodThirst into your bar program.
              </p>
              <ul className="grid gap-3">
                {contactChannels.map((channel) => (
                  <li key={channel.label} className="flex items-baseline justify-between gap-3 rounded-xl border border-ash/50 bg-ash/20 px-4 py-3">
                    <span className="text-xs uppercase tracking-wide text-bone/60">{channel.label}</span>
                  <a href={channel.href} className="text-sm font-medium text-bone hover:text-blood transition-colors">
                    {channel.value}
                  </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-panel space-y-3 text-sm text-offwhite/70">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-bone/80">Office hours</h3>
              <p>Monday — Saturday · 11:00 to 20:00 IST</p>
              <p>Expect a reply within 24 hours. For urgent logistics, use the WhatsApp hotline above.</p>
            </div>
          </div>

          <div className="space-y-3">
            <ContactForm action={process.env.NEXT_PUBLIC_WORKER_ENDPOINT || undefined} />
            <p className="text-xs text-offwhite/50">
              By submitting, you agree to receive mission-critical updates from UNHOLY CO. No spam, only rituals.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
