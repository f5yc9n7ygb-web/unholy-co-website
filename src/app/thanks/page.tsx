import Link from "next/link"
import { Suspense } from "react"
import { ThanksContent } from "./ThanksContent"

export const metadata = {
  title: "Thank You — UNHOLY CO.",
  description: "Your order has been received. Check your email for confirmation and ritual tracking details."
}

export default function ThanksPage() {
  return (
    <Suspense fallback={<ThanksLoading />}>
      <ThanksContent />
    </Suspense>
  )
}

function ThanksLoading() {
  return (
    <div className="section">
      <div className="container max-w-3xl text-center space-y-4">
        <div className="h-12 w-12 mx-auto rounded-full bg-ash/30 animate-pulse" />
        <p className="text-bone/50">Loading order details...</p>
      </div>
    </div>
  )
}
