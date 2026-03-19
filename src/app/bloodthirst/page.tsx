import type { Metadata } from "next"
import { BloodThirstClient } from "./BloodThirstClient"

export const metadata: Metadata = {
  title: "BloodThirst — UNHOLY CO.",
  description:
    "Natural Himalayan mineral water at 11,000 feet. Zero sugar, zero plastic. Sealed in obsidian-black aluminum for night rituals, backstage riders, and everyone done settling for basic.",
}

export default function BloodThirstPage() {
  return <BloodThirstClient />
}
