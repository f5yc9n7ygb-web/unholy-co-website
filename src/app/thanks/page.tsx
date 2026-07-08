import { cookies } from "next/headers"
import { getKVNamespace } from "@/lib/server/kv"
import { readReceiptReference, readReceiptToken } from "@/lib/server/order-session"
import { RECEIPT_COOKIE } from "@/lib/server/order-session"
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
  const receiptRefParam = resolvedSearchParams.receiptRef
  const legacyReceiptToken = Array.isArray(receiptParam) ? receiptParam[0] : receiptParam
  const receiptRef = Array.isArray(receiptRefParam) ? receiptRefParam[0] : receiptRefParam
  const receiptTokenFromRef = receiptRef
    ? await readReceiptReference(receiptRef, await getKVNamespace())
    : null
  const receiptToken = receiptTokenFromRef || legacyReceiptToken || (await cookies()).get(RECEIPT_COOKIE)?.value
  const receipt = readReceiptToken(receiptToken)

  return (
    <ThanksContent receipt={receipt} />
  )
}
