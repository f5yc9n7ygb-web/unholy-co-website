"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"
import { MotionConfig } from "framer-motion"
import { PACKS, type Pack } from "@/lib/shop/catalog"
import { trackPixel } from "@/lib/meta-pixel"
import type { ShippingForm } from "@/lib/shop/types"
import { usePageTransition } from "@/context/TransitionContext"

import { Altar } from "./components/Altar"
import { ProductFilm } from "./components/ProductFilm"
import { AnchorLine } from "./components/AnchorLine"
import { PactDial } from "./components/PactDial"
import { PactMeter } from "./components/PactMeter"
import { Rites } from "./components/Rites"
import { WhisperWall } from "./components/WhisperWall"
import { Seal, type FormErrors } from "./components/Seal"
import { CommitBar } from "./components/CommitBar"

declare global {
  interface Window {
    Razorpay: any
  }
}

function validateForm(form: ShippingForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = "Name is required"
  if (!form.email.trim()) errors.email = "Email is required"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email"
  if (!form.phone.trim()) errors.phone = "Phone is required"
  else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "")))
    errors.phone = "Enter 10-digit mobile number"
  if (!form.address.trim()) errors.address = "Address is required"
  if (!form.city.trim()) errors.city = "City is required"
  if (!form.pincode.trim()) errors.pincode = "Pincode is required"
  else if (!/^\d{6}$/.test(form.pincode.trim()))
    errors.pincode = "Enter valid 6-digit pincode"
  if (!form.state) errors.state = "State is required"
  return errors
}

const BATCH_TOTAL = 1000
/** Stable SSR baseline — client drifts upward after mount to avoid hydration mismatch. */
const BATCH_BASELINE = 847

/** Deterministic pseudo-live claimed count: drifts upward over time. */
function computeBatchClaimed() {
  const baseEpoch = new Date("2026-04-15T00:00:00.000Z").getTime()
  const hoursSince = Math.max(0, (Date.now() - baseEpoch) / (1000 * 60 * 60))
  const drift = Math.floor(hoursSince * 1.4)
  return Math.min(BATCH_TOTAL - 12, 720 + drift)
}

export function ShopCDTestClient({ razorpayKey }: { razorpayKey?: string }) {
  const { navigate } = usePageTransition()
  const sealRef = useRef<HTMLElement>(null)

  const [selected, setSelected] = useState<Pack>(
    PACKS.find((p) => p.id === "pack12") || PACKS[0]
  )
  const [form, setForm] = useState<ShippingForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    state: "",
    gstNumber: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [wax, setWax] = useState(false)

  const [batchClaimed, setBatchClaimed] = useState<number>(BATCH_BASELINE)
  useEffect(() => {
    setBatchClaimed(computeBatchClaimed())
  }, [])

  // ── Persist selection + shipping in localStorage (share key with /shop) ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem("unholy_cart")
      if (saved) {
        const data = JSON.parse(saved)
        if (data.packId) {
          const pack = PACKS.find((p) => p.id === data.packId)
          if (pack) setSelected(pack)
        }
        if (data.shipping) {
          setForm((prev) => ({ ...prev, ...data.shipping }))
        }
      }
    } catch {
      /* ignore corrupt data */
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          "unholy_cart",
          JSON.stringify({ packId: selected.id, shipping: form })
        )
      } catch {
        /* storage unavailable */
      }
    }, 300)
    return () => clearTimeout(t)
  }, [selected, form])

  // Live-validate visible fields after first touch
  useEffect(() => {
    if (touched.size === 0) return
    const all = validateForm(form)
    const visible: FormErrors = {}
    touched.forEach((k) => {
      const key = k as keyof ShippingForm
      if (all[key]) visible[key] = all[key]
    })
    setErrors(visible)
  }, [form, touched])

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }
  const blurField = (field: keyof ShippingForm) => {
    setTouched((prev) => new Set(prev).add(field))
  }

  const handleSelect = (pack: Pack) => {
    if (pack.id === selected.id) return
    setSelected(pack)
    trackPixel("ViewContent", {
      value: pack.price,
      currency: "INR",
      content_ids: [pack.id],
      content_name: pack.title,
      content_type: "product",
      num_items: pack.qty,
    })
  }

  const scrollToSeal = () => {
    sealRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const onSeal = async () => {
    if (loading || wax) return

    // Validate
    const allErrors = validateForm(form)
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setTouched(new Set(Object.keys(form)))
      scrollToSeal()
      return
    }

    if (!razorpayKey || typeof window === "undefined" || !window.Razorpay) {
      setPayError("Payment gateway is not configured.")
      return
    }

    trackPixel("InitiateCheckout", {
      value: selected.price,
      currency: "INR",
      content_ids: [selected.id],
      content_name: selected.title,
      content_type: "product",
      num_items: selected.qty,
      contents: [{ id: selected.id, quantity: 1, item_price: selected.price }],
    })

    setWax(true)
    setPayError(null)

    // Wax seal animation before Razorpay opens
    await new Promise((r) => setTimeout(r, 320))

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: selected.id,
          shipping: form,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error("Unable to start checkout right now.")

      setWax(false)
      setLoading(true)

      const rz = new window.Razorpay({
        key: razorpayKey,
        order_id: data.order.id,
        name: "UNHOLY CO.",
        description: `${selected.title} — ${selected.qty} cans`,
        image: "/favicon.svg",
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch("/api/order/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: data.order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                sessionToken: data.sessionToken,
              }),
            })
            const verification = await verifyResponse.json()
            if (!verifyResponse.ok || !verification.ok) {
              throw new Error(
                verifyResponse.status === 409
                  ? "This payment has already been confirmed."
                  : "We could not verify your payment immediately. Please contact rituals@theunholy.co"
              )
            }
            try {
              localStorage.removeItem("unholy_cart")
            } catch {
              /* noop */
            }
            navigate(`/thanks?receipt=${encodeURIComponent(verification.receiptToken)}`)
          } catch (error: any) {
            setPayError(error?.message || "Payment verification failed.")
            setLoading(false)
          }
        },
        theme: { color: "#B00020" },
        modal: { ondismiss: () => setLoading(false) },
      })
      rz.on("payment.failed", (resp: any) => {
        const reason =
          resp?.error?.description ||
          "Payment was declined. Please try again or use a different payment method."
        setPayError(reason)
        setLoading(false)
      })
      rz.open()
    } catch (e: any) {
      setWax(false)
      setLoading(false)
      setPayError(e?.message || "Payment failed to initialize.")
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <main className="relative z-10 bg-black text-offwhite">
        <Altar batchClaimed={batchClaimed} batchTotal={BATCH_TOTAL} />
        <ProductFilm />
        <AnchorLine />
        <PactDial selected={selected} onSelect={handleSelect} />
        <PactMeter claimed={batchClaimed} total={BATCH_TOTAL} />
        <Rites />
        <WhisperWall />
        <Seal
          ref={sealRef}
          selected={selected}
          form={form}
          errors={errors}
          loading={loading}
          payError={payError}
          onChange={updateField}
          onBlur={blurField}
          onSeal={onSeal}
          wax={wax}
        />
      </main>

      <CommitBar selected={selected} onSeal={scrollToSeal} />
    </MotionConfig>
  )
}
