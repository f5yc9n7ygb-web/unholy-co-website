import type { Metadata } from "next"
import TeaserClient from "./TeaserClient"

export const metadata: Metadata = {
  title: "Something Unholy Is Coming — UNHOLY CO.",
  description:
    "Not your salvation. Something is coming. Claim your place in the ritual before the ordinary even know what this is.",
  openGraph: {
    title: "Something Unholy Is Coming — UNHOLY CO.",
    description: "Not your salvation. BLOODTHIRST by UNHOLY CO. — coming soon.",
    images: ["/og-hero.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Something Unholy Is Coming",
    description: "Not your salvation. BLOODTHIRST by UNHOLY CO. — coming soon.",
    images: ["/og-hero.png"],
  },
}

export default function TeaserPage() {
  return <TeaserClient />
}
