import { readReceiptToken } from "@/lib/server/order-session"
import { ThanksContent } from "./ThanksContent"

export const metadata = {
  title: "Thank You — UNHOLY CO.",
  description: "Your order has been received. Check your email for confirmation and ritual tracking details.",
  robots: { index: false, follow: false },
}

type ThanksPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ThanksPage({ searchParams }: ThanksPageProps) {
  const resolvedSearchParams = (await searchParams) || {}
  const receiptParam = resolvedSearchParams.receipt
  const receiptToken = Array.isArray(receiptParam) ? receiptParam[0] : receiptParam
  const receipt = readReceiptToken(receiptToken)

  return (
    <ThanksContent receipt={receipt} />
  )
}
