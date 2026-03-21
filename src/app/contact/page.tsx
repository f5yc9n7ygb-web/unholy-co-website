import type { Metadata } from "next"
import { ContactClient } from "./ContactClient"

export const metadata: Metadata = {
  title: "Contact",
  description: "Bookings, retail partnerships, press, or pure curiosity — reach the coven and we'll respond within 24 hours.",
  alternates: { canonical: '/contact' },
  openGraph: {
    title: "Contact — UNHOLY CO.",
    description: "Bookings, retail partnerships, press, or pure curiosity — reach the coven and we'll respond within 24 hours.",
    url: '/contact',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'Contact UNHOLY CO.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Contact — UNHOLY CO.",
    description: "Bookings, retail partnerships, press, or pure curiosity — reach the coven.",
    images: ['/og-hero.png'],
  },
}

export default function ContactPage() {
  return <ContactClient />
}
