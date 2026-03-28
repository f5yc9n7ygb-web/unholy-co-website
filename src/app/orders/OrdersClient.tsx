"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"

type Order = {
  orderId: string
  paymentId: string
  pack: string
  quantity: number
  amount: number
  shippingStatus: string
  courierName: string
  awbCode: string
  timestamp: string
  promoCode: string
  discountAmount: number
}

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; orders: Order[] }
  | { state: "error"; message: string }

const STATUS_COLORS: Record<string, string> = {
  Processing: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  "AWB Assigned": "text-blue-400 border-blue-400/30 bg-blue-400/10",
  Shipped: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "In Transit": "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "Out for Delivery": "text-green-400 border-green-400/30 bg-green-400/10",
  Delivered: "text-green-400 border-green-400/30 bg-green-400/10",
}

export function OrdersClient() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>({ state: "idle" })

  const lookup = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus({ state: "error", message: "Enter a valid email address." })
      return
    }

    setStatus({ state: "loading" })
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to look up orders.")
      }
      setStatus({ state: "success", orders: data.orders })
    } catch (err: any) {
      setStatus({ state: "error", message: err?.message || "Something went wrong." })
    }
  }

  return (
    <div className="min-h-screen px-4 py-24 md:py-32">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <p className="mb-6 text-[10px] uppercase tracking-[0.5em] text-blood/60">
            Your Orders
          </p>
          <h1 className="font-cinzel text-4xl font-bold text-offwhite md:text-5xl">
            Order <span className="text-blood">History</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-bone/50">
            Enter the email you used at checkout to view all your orders.
          </p>
        </motion.div>

        {/* Lookup form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="you@domain.com"
              className="flex-1 rounded-xl border border-white/[0.08] bg-black/50 px-4 py-3.5 text-sm text-offwhite placeholder:text-bone/20 outline-none transition-all duration-200 focus:border-blood/60 focus:ring-1 focus:ring-blood/20"
            />
            <motion.button
              onClick={lookup}
              disabled={status.state === "loading"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary shrink-0 px-6 py-3.5 text-sm disabled:opacity-60"
            >
              {status.state === "loading" ? "Looking up..." : "Find Orders"}
            </motion.button>
          </div>

          {status.state === "error" && (
            <p className="mt-3 text-xs text-blood/80">{status.message}</p>
          )}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {status.state === "success" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {status.orders.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.07] bg-black/40 p-8 text-center">
                  <p className="text-sm text-bone/50">No orders found for this email.</p>
                  <TransitionLink href="/shop" className="mt-4 inline-block text-sm text-blood hover:text-blood/70 transition-colors">
                    Place your first order →
                  </TransitionLink>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-bone/30">
                    {status.orders.length} order{status.orders.length > 1 ? "s" : ""} found
                  </p>

                  {status.orders.map((order, i) => (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/50"
                      style={{
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                      }}
                    >
                      {/* Top row */}
                      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                        <span className="text-[10px] uppercase tracking-[0.28em] text-bone/35">
                          {order.timestamp
                            ? new Date(order.timestamp).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_COLORS[order.shippingStatus] || "text-bone/40 border-bone/20 bg-bone/5"
                          }`}
                        >
                          {order.shippingStatus}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-cinzel text-lg font-bold text-offwhite">
                              {order.pack}
                            </p>
                            <p className="mt-0.5 text-xs text-bone/40">
                              {order.quantity} × BloodThirst 500ml
                            </p>
                            {order.promoCode && (
                              <p className="mt-1 text-[10px] text-green-400/70">
                                Promo: {order.promoCode} (−₹{Number(order.discountAmount).toLocaleString("en-IN")})
                              </p>
                            )}
                          </div>
                          <p className="font-cinzel text-xl font-black text-offwhite">
                            ₹{Number(order.amount).toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Details row */}
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-bone/25">Order ID</span>
                            <p className="mt-0.5 font-mono text-bone/50 break-all">{order.orderId}</p>
                          </div>
                          {order.courierName && (
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-bone/25">Courier</span>
                              <p className="mt-0.5 text-bone/50">{order.courierName}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex gap-3">
                          {order.awbCode && (
                            <TransitionLink
                              href={`/track?id=${encodeURIComponent(order.orderId)}`}
                              className="text-[11px] text-blood transition-colors hover:text-blood/70"
                            >
                              Track Shipment →
                            </TransitionLink>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom links */}
        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm">
          <TransitionLink href="/track" className="text-bone/40 transition-colors hover:text-offwhite">
            Track a specific order
          </TransitionLink>
          <span className="text-bone/15">·</span>
          <TransitionLink href="/contact" className="text-bone/40 transition-colors hover:text-offwhite">
            Need help?
          </TransitionLink>
        </div>
      </div>
    </div>
  )
}
