"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"

type TrackingActivity = {
  date: string
  status: string
  activity: string
  location: string
}

type Order = {
  orderId: string
  pack: string
  quantity: number
  amount: number
  placedAt: string
  shippingStatus: string
  awbCode: string | null
  courierName: string | null
  etd: string | null
  deliveredAt: string | null
  trackingActivities: TrackingActivity[] | null
}

type TrackState = "idle" | "loading" | "success" | "error"

const fadeUp = (delay = 0) => ({
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -8, opacity: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
})

const STATUS_STEPS = [
  { key: "Processing", label: "Processing", desc: "Order confirmed, preparing shipment" },
  { key: "AWB Assigned", label: "Booked", desc: "Courier assigned, pickup scheduled" },
  { key: "Shipped", label: "Shipped", desc: "Package picked up by courier" },
  { key: "In Transit", label: "In Transit", desc: "On the way to your city" },
  { key: "Out for Delivery", label: "Out for Delivery", desc: "Arriving today" },
  { key: "Delivered", label: "Delivered", desc: "Delivered successfully" },
]

function getStepIndex(status: string): number {
  const normalized = status.toLowerCase()
  if (normalized.includes("deliver") && !normalized.includes("out for")) return 5
  if (normalized.includes("out for delivery")) return 4
  if (normalized.includes("transit") || normalized.includes("reached")) return 3
  if (normalized.includes("ship") || normalized.includes("picked")) return 2
  if (normalized.includes("awb") || normalized.includes("booked") || normalized.includes("pickup")) return 1
  return 0
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export function TrackClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [orderIdHint, setOrderIdHint] = useState("")
  const [state, setState] = useState<TrackState>("idle")
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState("")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const isEmail = query.trim().includes("@")

  const handleTrack = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim()
    if (!q) return

    setState("loading")
    setError("")

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, orderId: orderIdHint.trim() || undefined }),
      })

      const data = await res.json()

      if (!data.ok) {
        setState("error")
        setError(data.error || "Unable to find the order.")
        setOrders([])
        return
      }

      setOrders(data.orders)
      setState("success")
      if (data.orders.length === 1) {
        setExpandedOrder(data.orders[0].orderId)
      }
    } catch {
      setState("error")
      setError("Something went wrong. Please try again.")
      setOrders([])
    }
  }, [query])

  // Auto-search if initialQuery is provided
  useEffect(() => {
    if (initialQuery) {
      handleTrack(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative min-h-[90vh] overflow-hidden">
      {/* Ghost background text */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
      >
        <span className="font-cinzel text-[22vw] font-black leading-none text-bone/[0.035]">
          TRACK
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-28 md:py-36">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="text-center">
          <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/60">
            Order tracking
          </p>
          <h1 className="font-cinzel text-3xl font-bold text-offwhite md:text-4xl lg:text-5xl">
            Track your ritual.
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bone/40">
            Enter your order ID or the email you used at checkout.
          </p>
        </motion.div>

        {/* Search form */}
        <motion.div {...fadeUp(0.1)} className="mt-10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleTrack()
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOrderIdHint("") }}
              placeholder="Order ID or email address"
              className="flex-1 rounded-lg border border-white/[0.08] bg-black/50 px-4 py-3.5 text-sm text-offwhite placeholder:text-bone/25 outline-none transition-colors focus:border-blood/40 focus:ring-1 focus:ring-blood/20"
            />
            <button
              type="submit"
              disabled={state === "loading" || !query.trim() || (isEmail && !orderIdHint.trim())}
              className="rounded-lg bg-blood px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-all hover:bg-blood/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state === "loading" ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Track"
              )}
            </button>
            </div>
            {isEmail && (
              <input
                type="text"
                value={orderIdHint}
                onChange={(e) => setOrderIdHint(e.target.value)}
                placeholder="Order ID (from your confirmation email)"
                className="w-full rounded-lg border border-white/[0.08] bg-black/50 px-4 py-3.5 text-sm text-offwhite placeholder:text-bone/25 outline-none transition-colors focus:border-blood/40 focus:ring-1 focus:ring-blood/20"
              />
            )}
          </form>
        </motion.div>

        {/* Error state */}
        <AnimatePresence mode="wait">
          {state === "error" && (
            <motion.div
              key="error"
              {...fadeUp(0)}
              className="mt-8 rounded-xl border border-blood/20 bg-blood/[0.06] px-5 py-4 text-center text-sm text-bone/60"
            >
              {error}
              <p className="mt-2 text-xs text-bone/30">
                If you just placed an order, it may take a few minutes to appear.{" "}
                <TransitionLink href="/contact" className="text-blood/60 underline underline-offset-2 hover:text-blood">
                  Contact support
                </TransitionLink>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">
          {state === "success" && orders.length > 0 && (
            <motion.div key="results" {...fadeUp(0)} className="mt-10 space-y-6">
              {orders.map((order, idx) => {
                const stepIndex = getStepIndex(order.shippingStatus)
                const isExpanded = expandedOrder === order.orderId

                return (
                  <motion.div
                    key={order.orderId}
                    {...fadeUp(idx * 0.08)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                  >
                    {/* Order header — clickable if multiple orders */}
                    <button
                      type="button"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.orderId)}
                      className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-white/[0.02]"
                    >
                      <div>
                        <p className="text-xs text-bone/30 font-mono">{order.orderId}</p>
                        <p className="mt-1 text-sm font-medium text-offwhite/80">{order.pack}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                            stepIndex >= 5
                              ? "bg-green-900/30 text-green-400 border border-green-800/40"
                              : stepIndex >= 3
                                ? "bg-blood/10 text-blood border border-blood/20"
                                : "bg-white/5 text-bone/50 border border-white/10"
                          }`}
                        >
                          {order.shippingStatus}
                        </span>
                      </div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/[0.06] px-5 pb-6 pt-5">
                            {/* Progress bar */}
                            <div className="mb-8">
                              <div className="flex items-center justify-between">
                                {STATUS_STEPS.map((step, i) => (
                                  <div key={step.key} className="flex flex-col items-center flex-1">
                                    <div
                                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                                        i <= stepIndex
                                          ? i === stepIndex
                                            ? "bg-blood text-white shadow-[0_0_16px_rgba(176,0,32,0.4)]"
                                            : "bg-blood/60 text-white/80"
                                          : "bg-white/5 text-bone/25"
                                      }`}
                                    >
                                      {i < stepIndex ? (
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : (
                                        <span>{String(i + 1).padStart(2, "0")}</span>
                                      )}
                                    </div>
                                    <p className={`mt-2 text-center text-[9px] uppercase tracking-wide leading-tight ${
                                      i <= stepIndex ? "text-bone/50" : "text-bone/20"
                                    }`}>
                                      {step.label}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              {/* Connecting line */}
                              <div className="relative mx-auto mt-[-30px] mb-6" style={{ width: "calc(100% - 56px)", zIndex: -1 }}>
                                <div className="h-[2px] w-full bg-white/[0.06]" />
                                <div
                                  className="absolute left-0 top-0 h-[2px] bg-blood/50 transition-all duration-500"
                                  style={{ width: `${Math.min(100, (stepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Order details */}
                            <div className="space-y-0">
                              <div className="h-px bg-white/[0.06]" />
                              <DetailRow label="Pack" value={`${order.pack} (${order.quantity} cans)`} />
                              <DetailRow label="Amount" value={`₹${order.amount.toLocaleString("en-IN")}`} />
                              <DetailRow label="Placed" value={formatDate(order.placedAt)} />
                              {order.awbCode && <DetailRow label="AWB" value={order.awbCode} mono />}
                              {order.courierName && <DetailRow label="Courier" value={order.courierName} />}
                              {order.etd && <DetailRow label="Expected Delivery" value={order.etd} />}
                              {order.deliveredAt && <DetailRow label="Delivered" value={formatDate(order.deliveredAt)} />}
                            </div>

                            {/* Tracking activities */}
                            {order.trackingActivities && order.trackingActivities.length > 0 && (
                              <div className="mt-6">
                                <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-bone/30">
                                  Shipment activity
                                </p>
                                <div className="space-y-0">
                                  {order.trackingActivities.slice(0, 10).map((activity, i) => (
                                    <div key={i} className="flex gap-4 py-3 border-b border-white/[0.04] last:border-0">
                                      <div className="flex flex-col items-center">
                                        <div className={`h-2 w-2 rounded-full ${i === 0 ? "bg-blood" : "bg-bone/20"}`} />
                                        {i < Math.min(9, (order.trackingActivities?.length ?? 0) - 1) && (
                                          <div className="w-px flex-1 bg-white/[0.06] mt-1" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-offwhite/70">{activity.activity}</p>
                                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-bone/30">
                                          <span>{formatDate(activity.date)}</span>
                                          {activity.location && (
                                            <>
                                              <span className="text-bone/15">|</span>
                                              <span>{activity.location}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Reorder + Refund + Invoice actions */}
                            <div className="mt-6 flex flex-wrap gap-3">
                              <a
                                href={`/shop?pack=${order.orderId ? "" : ""}${order.quantity <= 6 ? "pack6" : order.quantity <= 12 ? "pack12" : "pack24"}`}
                                className="rounded-lg bg-blood px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-blood/90"
                              >
                                Reorder
                              </a>
                              <a
                                href={`/api/invoice/${encodeURIComponent(order.orderId)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-white/[0.08] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-bone/50 transition-all hover:border-blood/30 hover:text-bone/70"
                              >
                                Download Invoice
                              </a>
                              <a
                                href={`/refund?order=${encodeURIComponent(order.orderId)}`}
                                className="rounded-lg border border-white/[0.08] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-bone/50 transition-all hover:border-blood/30 hover:text-bone/70"
                              >
                                Request Refund
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help text */}
        <motion.div {...fadeUp(0.2)} className="mt-14 text-center">
          <p className="text-xs text-bone/25">
            Can&apos;t find your order?{" "}
            <TransitionLink href="/contact" className="text-blood/50 underline underline-offset-2 hover:text-blood">
              Contact us
            </TransitionLink>{" "}
            and we&apos;ll help you out.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between py-3.5">
        <span className="text-[11px] uppercase tracking-widest text-bone/30">{label}</span>
        <span className={`text-sm text-bone/60 ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
      </div>
      <div className="h-px bg-white/[0.04]" />
    </>
  )
}
