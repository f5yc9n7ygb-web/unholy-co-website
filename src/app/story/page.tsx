import type { Metadata } from "next"
import { StoryClient } from "./StoryClient"

export const metadata: Metadata = {
  title: "Story — UNHOLY CO.",
  description: "From a vow to destroy plastic bottles in India to a cult-favorite canned water ritual. This is how UNHOLY CO. was forged.",
}

export default function StoryPage() {
  return <StoryClient />
}
