import type { Metadata } from "next"
import { LegalClient } from "./LegalClient"

export const metadata: Metadata = {
  title: "Legal",
  description:
    "Privacy, shipping, returns, and website terms for UNHOLY CO. and BloodThirst.",
  alternates: { canonical: "/legal" },
  openGraph: {
    title: "Legal — UNHOLY CO.",
    description:
      "Privacy, shipping, returns, and website terms for UNHOLY CO. and BloodThirst.",
    url: "/legal",
    images: [{ url: "/og-hero.png", width: 1200, height: 630, alt: "Legal — UNHOLY CO." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal — UNHOLY CO.",
    description:
      "Privacy, shipping, returns, and website terms for UNHOLY CO. and BloodThirst.",
    images: ["/og-hero.png"],
  },
}

export default function LegalPage() {
  return <LegalClient />
}
