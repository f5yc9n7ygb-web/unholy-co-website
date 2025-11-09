 "use client"

import Script from "next/script"
import { useState } from "react"
import { MicroHero } from "@/components/layout/MicroHero"

type Pack = { id: string; title: string; qty: number; price: number; blurb: string } // price in INR

const PACKS: Pack[] = [
  { id: "pack6", title: "BloodThirst — 6 Pack", qty: 6, price: 449, blurb: "For the mildly damned." },
  { id: "pack12", title: "BloodThirst — 12 Pack", qty: 12, price: 849, blurb: "For weekend rituals." },
  { id: "pack24", title: "BloodThirst — 24 Pack", qty: 24, price: 1599, blurb: "For true believers." },
]

declare global {
  interface Window {
    Razorpay: any
  }
}

/**
 * The client-side component for the shop page.
 * This component handles user interaction, form state, and the Razorpay payment integration.
 * It allows users to select a product pack, fill in shipping details, and complete the purchase.
 *
 * @returns {JSX.Element} The rendered shop interface.
 */
export function ShopClient() {
  const [selected, setSelected] = useState<Pack | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    state: "",
  })

  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const orderEndpoint = process.env.NEXT_PUBLIC_WORKER_ORDER_ENDPOINT

  const onPay = async (pack: Pack) => {
    if (!key || !orderEndpoint) {
      alert("Payment not configured. Missing keys.")
      return
    }
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.pincode || !form.state) {
      alert("Please fill shipping details.")
      return
    }
    setLoading(true)
    try {
      const amountPaise = pack.price * 100
      const res = await fetch(orderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `${pack.id}_${Date.now()}`,
          notes: {
            product: pack.title,
            qty: pack.qty,
            name: form.name,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            pincode: form.pincode,
            state: form.state,
          },
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || "Order error")

      const options = {
        key,
        order_id: data.order.id,
        name: "UNHOLY CO.",
        description: pack.title,
        image: "/favicon.svg",
        handler: function (response: any) {
          window.location.href = `/thanks?order=${data.order.id}&pay=${response.razorpay_payment_id}`
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          address: `${form.address}, ${form.city} ${form.pincode}, ${form.state}`,
        },
        theme: { color: "#B00020" },
      }

      const rz = new window.Razorpay(options)
      rz.open()
    } catch (e: any) {
      alert(e?.message || "Payment failed to initialize.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="container space-y-12">
        <MicroHero
          eyebrow="THE RITUAL STORE"
          title="Shop BloodThirst"
          description="Pick your pack, fill the shipping rites, and we’ll dispatch cold-forged cans straight to your door."
          actions={[
            { label: "View Specs", href: "/bloodthirst", variant: "ghost" },
            { label: "Need support?", href: "/contact", variant: "ghost" },
          ]}
        />

        <div className="grid gap-6 md:grid-cols-3">
          {PACKS.map((pack) => {
            const isSelected = selected?.id === pack.id
            return (
              <div
                key={pack.id}
                className={`glass-panel cursor-pointer transition ${isSelected ? "border-blood/60 shadow-[0_28px_90px_rgba(176,0,32,0.25)]" : ""}`}
                onClick={() => setSelected(pack)}
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-bone/50">
                  <span>{pack.qty} cans</span>
                  {isSelected ? <span className="text-blood">Selected</span> : <span>Ready</span>}
                </div>
                <h3 className="text-xl font-semibold text-bone mt-3">{pack.title}</h3>
                <p className="text-offwhite/70 text-sm mt-2">{pack.blurb}</p>
                <div className="mt-6 text-3xl font-semibold text-offwhite">₹{pack.price}</div>
                <button
                  className="btn btn-primary mt-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPay(pack)
                  }}
                  disabled={loading}
                >
                  {loading && isSelected ? "Processing…" : "Buy Now"}
                </button>
              </div>
            )
          })}
        </div>

        <div className="glass-panel space-y-5">
          <h2 className="h2">Shipping details</h2>
          <p className="text-sm text-offwhite/70">
            Fill in the ritual ledger below. These details are encrypted and sent with your Razorpay order so we can ship fast.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="bg-ash/40 border border-ash rounded-xl px-3 py-2 text-offwhite"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="bg-ash/40 border border-ash rounded-xl px-3 py-2 text-offwhite"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="bg-ash/40 border border-ash rounded-xl px-3 py-2 text-offwhite"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="bg-ash/40 border border-ash rounded-xl px-3 py-2 text-offwhite"
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
            <input
              className="md:col-span-2 bg-ash/40 border border-ash rounded-xl px-3 py-2 text-offwhite"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <input
              className="bg-ash/40 border border-ash rounded-xl px-3 py-2 text-offwhite"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <input
              className="bg-ash/40 border border-ash rounded-xl px-3 py-2 text-offwhite"
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>
          <p className="text-xs text-offwhite/60">
            We include these with your order notes. Confirmation arrives via email once the ritual is complete.
          </p>
        </div>
      </div>
    </div>
  )
}
