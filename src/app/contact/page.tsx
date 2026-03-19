import type { Metadata } from "next"
import { ContactClient } from "./ContactClient"

export const metadata: Metadata = {
  title: "Contact — UNHOLY CO.",
  description: "Bookings, retail partnerships, press, or pure curiosity — reach the coven and we’ll respond within 24 hours.",
}

export default function ContactPage() {
  return <ContactClient />
}
