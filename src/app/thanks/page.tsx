import Link from "next/link"
import { MicroHero } from "@/components/layout/MicroHero"

export const metadata = {
  title: "Thank You — UNHOLY CO.",
  description: "Your order has been received. Check your email for confirmation and ritual tracking details."
}

export default function ThanksPage() {
  return (
    <div className="section">
      <div className="container max-w-3xl">
        <MicroHero
          eyebrow="ORDER CONFIRMED"
          title="You’re in. Stay Unholy."
          description="Payment processed or pending confirmation. We’ll email your ritual receipt and shipping updates shortly."
          actions={[{ label: "Return Home", href: "/" }]}
        />
        <div className="mt-10 glass-panel space-y-3 text-sm text-offwhite/70">
          <p>Need to tweak your shipping details or request bulk quantities? Reply to the confirmation email or head to the contact page.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-ghost">Contact Support</Link>
            <Link href="/drops" className="btn btn-primary">Track the next drop</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
