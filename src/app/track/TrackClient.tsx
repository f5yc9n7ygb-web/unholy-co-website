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
  customerEmail: string
  customerPhone?: string
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
type Tab = "track" | "history"

const STATUS_STEPS = [
  { key: "Processing", label: "Processing" },
  { key: "AWB Assigned", label: "Booked" },
  { key: "Shipped", label: "Shipped" },
  { key: "In Transit", label: "In Transit" },
  { key: "Out for Delivery", label: "Out for Delivery" },
  { key: "Delivered", label: "Delivered" },
]

function getStepIndex(status: string): number {
  const n = status.toLowerCase()
  if (n.includes("deliver") && !n.includes("out for")) return 5
  if (n.includes("out for delivery")) return 4
  if (n.includes("transit") || n.includes("reached")) return 3
  if (n.includes("ship") || n.includes("picked")) return 2
  if (n.includes("awb") || n.includes("booked") || n.includes("pickup")) return 1
  return 0
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch { return dateStr }
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ""
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    })
  } catch { return dateStr }
}

function StatusBadge({ status }: { status: string }) {
  const idx = getStepIndex(status)
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
      idx >= 5 ? "bg-green-900/30 text-green-400 border border-green-800/40"
      : idx >= 3 ? "bg-blood/10 text-blood border border-blood/20"
      : "bg-white/5 text-bone/50 border border-white/10"
    }`}>
      {status}
    </span>
  )
}

function OrderCard({ order, defaultExpanded = false, showTrackingProgress = true }: {
  order: Order
  defaultExpanded?: boolean
  showTrackingProgress?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const stepIndex = getStepIndex(order.shippingStatus)
  const invoiceIdentifier = order.customerEmail
    ? `email=${encodeURIComponent(order.customerEmail)}`
    : order.customerPhone
      ? `phone=${encodeURIComponent(order.customerPhone)}`
      : ""
  const invoiceHref = `/api/invoice/${encodeURIComponent(order.orderId)}${invoiceIdentifier ? `?${invoiceIdentifier}` : ""}`

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="flex w-full items-center justify-between px-5 py-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-bone/30 font-mono">{order.orderId}</p>
          <div className="mt-1 flex items-center gap-3 flex-wrap">
            <p className="text-sm font-medium text-offwhite/80">{order.pack}</p>
            <span className="text-bone/20 text-xs hidden sm:inline">·</span>
            <p className="text-xs text-bone/35">{formatDateShort(order.placedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-3 flex-shrink-0">
          <StatusBadge status={order.shippingStatus} />
          <svg
            className={`h-4 w-4 text-bone/30 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

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
              {/* Progress stepper */}
              {showTrackingProgress && (
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    {STATUS_STEPS.map((step, i) => (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                          i <= stepIndex
                            ? i === stepIndex
                              ? "bg-blood text-white shadow-[0_0_16px_rgba(176,0,32,0.4)]"
                              : "bg-blood/60 text-white/80"
                            : "bg-white/5 text-bone/25"
                        }`}>
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
                  <div className="relative mx-auto mt-[-30px] mb-6" style={{ width: "calc(100% - 56px)", zIndex: -1 }}>
                    <div className="h-[2px] w-full bg-white/[0.06]" />
                    <div
                      className="absolute left-0 top-0 h-[2px] bg-blood/50 transition-all duration-500"
                      style={{ width: `${Math.min(100, (stepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Details */}
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

              {/* Tracking activity */}
              {order.trackingActivities && order.trackingActivities.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-bone/30">Shipment activity</p>
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
                              <><span className="text-bone/15">|</span><span>{activity.location}</span></>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`/shop?pack=${order.quantity <= 6 ? "pack6" : order.quantity <= 12 ? "pack12" : "pack24"}`}
                  className="btn btn-primary px-5 py-2.5 text-xs"
                >
                  Reorder
                </a>
                {invoiceIdentifier && (
                  <a
                    href={invoiceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost px-5 py-2.5 text-xs"
                  >
                    Download Invoice
                  </a>
                )}
                <a
                  href={`/refund?order=${encodeURIComponent(order.orderId)}`}
                  className="btn btn-ghost px-5 py-2.5 text-xs"
                >
                  Request Refund
                </a>
              </div>
              {!invoiceIdentifier && (
                <p className="mt-3 text-[11px] text-bone/25">
                  Need your invoice? Open the <span className="text-bone/40">My Orders</span> tab and verify with your email.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-black/50 px-4 py-3.5 text-sm text-offwhite placeholder:text-bone/25 outline-none transition-colors focus:border-blood/40 focus:ring-1 focus:ring-blood/20"

function Spinner() {
  return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
}

function ErrorBox({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-xl border border-blood/20 bg-blood/[0.06] px-5 py-4 text-center text-sm text-bone/60">
      {message}
      {children}
    </div>
  )
}

export function TrackClient({ initialQuery }: { initialQuery: string }) {
  const [tab, setTab] = useState<Tab>("track")

  const [trackQuery, setTrackQuery] = useState(initialQuery)
  const [trackState, setTrackState] = useState<TrackState>("idle")
  const [trackOrder, setTrackOrder] = useState<Order | null>(null)
  const [trackError, setTrackError] = useState("")

  const [histEmail, setHistEmail] = useState("")
  const [histOrderId, setHistOrderId] = useState("")
  const [histState, setHistState] = useState<TrackState>("idle")
  const [histOrders, setHistOrders] = useState<Order[]>([])
  const [histError, setHistError] = useState("")

  const handleTrack = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery ?? trackQuery).trim()
    if (!q) return
    setTrackState("loading")
    setTrackError("")
    setTrackOrder(null)
    try {
      const res = await fetch("/api/order-lookup", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({ query: q, mode: "track" }),
      })
      const data = await res.json()
      if (!data.ok) { setTrackState("error"); setTrackError(data.error || "Unable to find the order."); return }
      setTrackOrder(data.orders[0] || null)
      setTrackState("success")
    } catch {
      setTrackState("error")
      setTrackError("Something went wrong. Please try again.")
    }
  }, [trackQuery])

  const handleHistory = useCallback(async () => {
    const email = histEmail.trim()
    const orderId = histOrderId.trim()
    if (!email || !orderId) return
    setHistState("loading")
    setHistError("")
    setHistOrders([])
    try {
      const res = await fetch("/api/order-lookup", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({ query: email, orderId, mode: "history" }),
      })
      const data = await res.json()
      if (!data.ok) { setHistState("error"); setHistError(data.error || "Unable to find your orders."); return }
      setHistOrders(data.orders)
      setHistState("success")
    } catch {
      setHistState("error")
      setHistError("Something went wrong. Please try again.")
    }
  }, [histEmail, histOrderId])

  useEffect(() => {
    if (initialQuery) handleTrack(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative min-h-[90vh] overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden">
        <span className="font-cinzel text-[22vw] font-black leading-none text-bone/[0.035]">TRACK</span>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-28 md:py-36">
        {/* Header */}
        <div className="text-center">
          <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/60">Order tracking</p>
          <h1 className="font-cinzel text-3xl font-bold text-offwhite md:text-4xl lg:text-5xl">
            Track your ritual.
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-bone/40">
            Look up a specific order or view your full order history.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-10">
          <div className="flex rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
            {(["track", "history"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-widest transition-all ${
                  tab === t
                    ? "bg-blood text-white shadow-[0_0_20px_rgba(176,0,32,0.25)]"
                    : "text-bone/40 hover:text-bone/60"
                }`}
              >
                {t === "track" ? "Track Order" : "My Orders"}
              </button>
            ))}
          </div>
        </div>

        {/* Track tab */}
        {tab === "track" && (
          <div className="mt-6">
            <form onSubmit={(e) => { e.preventDefault(); handleTrack() }} className="flex gap-3">
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Order ID  (e.g. order_ABC123)"
                className={inputClass}
              />
              <button
                type="submit"
                disabled={trackState === "loading" || !trackQuery.trim()}
                className="btn btn-primary px-6 py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {trackState === "loading" ? <Spinner /> : "Track"}
              </button>
            </form>
            <p className="mt-2.5 text-[11px] text-bone/25">
              Find your order ID in the confirmation email we sent you.
            </p>

            {trackState === "error" && (
              <ErrorBox message={trackError}>
                <p className="mt-2 text-xs text-bone/30">
                  <TransitionLink href="/contact" className="text-blood/60 underline underline-offset-2 hover:text-blood">
                    Contact support
                  </TransitionLink>{" "}if you need help.
                </p>
              </ErrorBox>
            )}

            {trackState === "success" && trackOrder && (
              <div className="mt-8">
                <OrderCard order={trackOrder} defaultExpanded showTrackingProgress />
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {tab === "history" && (
          <div className="mt-6">
            <form onSubmit={(e) => { e.preventDefault(); handleHistory() }} className="flex flex-col gap-3">
              <input
                type="email"
                value={histEmail}
                onChange={(e) => setHistEmail(e.target.value)}
                placeholder="Email used at checkout"
                className={inputClass}
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={histOrderId}
                  onChange={(e) => setHistOrderId(e.target.value)}
                  placeholder="Any past order ID (to verify it's you)"
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={histState === "loading" || !histEmail.trim() || !histOrderId.trim()}
                  className="btn btn-primary px-6 py-3.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {histState === "loading" ? <Spinner /> : "View"}
                </button>
              </div>
            </form>
            <p className="mt-2.5 text-[11px] text-bone/25">
              We verify your identity with an order ID before showing your full history.
            </p>

            {histState === "error" && (
              <ErrorBox message={histError}>
                <p className="mt-2 text-xs text-bone/30">
                  <TransitionLink href="/contact" className="text-blood/60 underline underline-offset-2 hover:text-blood">
                    Contact support
                  </TransitionLink>{" "}if you need help.
                </p>
              </ErrorBox>
            )}

            {histState === "success" && histOrders.length > 0 && (
              <div className="mt-8 space-y-4">
                <p className="text-xs text-bone/30 uppercase tracking-widest">
                  {histOrders.length} order{histOrders.length !== 1 ? "s" : ""} found
                </p>
                {histOrders.map((order, idx) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    defaultExpanded={idx === 0}
                    showTrackingProgress={idx < 3}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help */}
        <div className="mt-14 text-center">
          <p className="text-xs text-bone/25">
            Can&apos;t find your order?{" "}
            <TransitionLink href="/contact" className="text-blood/50 underline underline-offset-2 hover:text-blood">
              Contact us
            </TransitionLink>{" "}
            and we&apos;ll help you out.
          </p>
        </div>
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
