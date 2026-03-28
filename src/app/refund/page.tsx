import type { Metadata } from "next"
import { RefundClient } from "./RefundClient"

export const metadata: Metadata = {
  title: "Request a Refund",
  description: "Submit a refund or return request for your UNHOLY CO. order.",
  alternates: { canonical: "/refund" },
  openGraph: {
    title: "Request a Refund — UNHOLY CO.",
    description: "Submit a refund or return request for your order.",
    url: "/refund",
  },
}

export default function RefundPage() {
  return <RefundClient />
}
