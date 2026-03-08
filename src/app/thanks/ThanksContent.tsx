"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

export function ThanksContent() {
  const params = useSearchParams()
  const orderId = params.get("order")
  const paymentId = params.get("pay")
  const qty = params.get("qty")

  return (
    <div className="section">
      <div className="container max-w-2xl space-y-8">
        {/* Success icon */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-blood/15 shadow-[0_0_40px_rgba(176,0,32,0.3)]"
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-10 w-10 text-blood"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path d="M5 13l4 4L19 7" />
            </motion.svg>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-3"
        >
          <h1 className="h1">Ritual Complete.</h1>
          <p className="p">Your order has been placed. We&apos;ll email confirmation and tracking details shortly.</p>
        </motion.div>

        {/* Order details */}
        {(orderId || paymentId) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-ash/40 bg-ash/15 p-5 space-y-3"
          >
            <h3 className="text-xs uppercase tracking-wider text-bone/50">Order Details</h3>
            <div className="space-y-2 text-sm">
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-bone/60">Order ID</span>
                  <span className="font-mono text-xs text-offwhite">{orderId}</span>
                </div>
              )}
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-bone/60">Payment ID</span>
                  <span className="font-mono text-xs text-offwhite">{paymentId}</span>
                </div>
              )}
              {qty && (
                <div className="flex justify-between">
                  <span className="text-bone/60">Quantity</span>
                  <span className="text-offwhite">{qty} cans</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border border-ash/40 bg-ash/15 p-5 space-y-4"
        >
          <h3 className="text-xs uppercase tracking-wider text-bone/50">What happens next</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { step: "1", title: "Confirmation", desc: "Email with order details within minutes" },
              { step: "2", title: "Dispatch", desc: "Packed and shipped within 24-48 hours" },
              { step: "3", title: "Delivered", desc: "Tracking link sent via email and SMS" },
            ].map((item) => (
              <div key={item.step} className="flex gap-3 sm:flex-col sm:text-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blood/15 text-xs font-bold text-blood sm:mx-auto">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-offwhite">{item.title}</p>
                  <p className="text-xs text-bone/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Link href="/" className="btn btn-ghost">Return Home</Link>
          <Link href="/contact" className="btn btn-ghost">Contact Support</Link>
          <Link href="/drops" className="btn btn-primary">Track the next drop</Link>
        </motion.div>
      </div>
    </div>
  )
}
