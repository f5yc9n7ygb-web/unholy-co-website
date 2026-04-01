import type { Metadata } from "next"
import { RefundClient } from "./RefundClient"

export const metadata: Metadata = {
  title: "Request a Refund",
  description: "Refunds are only issued for damaged, defective, or incorrect orders. Submit a request and we'll review it within 24–48 hours.",
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
