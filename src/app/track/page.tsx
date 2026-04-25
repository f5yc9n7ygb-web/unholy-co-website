import type { Metadata } from "next"
import { TrackClient } from "./TrackClient"

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Track your UNHOLY CO. BloodThirst order in real-time. Enter your order ID or email to see the latest shipping status.",
  alternates: { canonical: "/track" },
  openGraph: {
    title: "Track Your Order — UNHOLY CO.",
    description: "Track your BloodThirst order in real-time.",
    url: "/track",
  },
  twitter: {
    card: "summary",
    title: "Track Your Order — UNHOLY CO.",
    description: "Track your BloodThirst order in real-time.",
  },
}

type TrackPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const resolved = (await searchParams) || {}
  const orderParam = resolved.order
  const idParam = resolved.id
  const initialQueryParam = orderParam || idParam
  const initialQuery = Array.isArray(initialQueryParam) ? initialQueryParam[0] : initialQueryParam

  return <TrackClient initialQuery={initialQuery || ""} />
}
