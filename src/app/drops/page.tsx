import type { Metadata } from "next"
import { DropsClient } from "./DropsClient"

export const metadata: Metadata = {
  title: "Drops — UNHOLY CO.",
  description: "Limited-edition BloodThirst runs, collabs, and ritual-only flavors. Reserve yours before the coven drinks them dry.",
}

export default function DropsPage() {
  return <DropsClient />
}
