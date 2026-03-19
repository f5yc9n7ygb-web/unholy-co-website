import type { Metadata } from "next"
import { LegalClient } from "./LegalClient"

export const metadata: Metadata = {
  title: "Legal — UNHOLY CO.",
  description:
    "Privacy, shipping, returns, and website terms for UNHOLY CO. and BloodThirst.",
}

export default function LegalPage() {
  return <LegalClient />
}
