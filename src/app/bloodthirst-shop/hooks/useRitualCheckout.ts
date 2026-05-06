"use client"

import { useCallback, useEffect, useState } from "react"
import { PACKS, type Pack } from "@/lib/shop/catalog"
import type { ShippingForm } from "@/lib/shop/types"
import { trackPixel } from "@/lib/meta-pixel"
import { usePageTransition } from "@/context/TransitionContext"

declare global {
  interface Window {
    Razorpay: any
  }
}

export type FormErrors = Partial<Record<keyof ShippingForm, string>>

export type CheckoutPhase = "idle" | "submitting" | "sealed" | "error"

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
]

export function validateForm(form: ShippingForm): FormErrors {
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

const EMPTY_FORM: ShippingForm = {
  name: "", email: "", phone: "", address: "", city: "", pincode: "", state: "", gstNumber: "",
}

type Args = { razorpayKey?: string }

export function useRitualCheckout({ razorpayKey }: Args) {
  const { navigate } = usePageTransition()

  const [selected, setSelected] = useState<Pack>(
    PACKS.find((p) => p.id === "pack12") || PACKS[0]
  )
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [phase, setPhase] = useState<CheckoutPhase>("idle")
  const [payError, setPayError] = useState<string | null>(null)
  const [receiptToken, setReceiptToken] = useState<string | null>(null)

  // Restore cart on mount (shared key with /shop)
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
    } catch { /* ignore */ }
  }, [])

  // Persist
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          "unholy_cart",
          JSON.stringify({ packId: selected.id, shipping: form })
        )
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(t)
  }, [selected, form])

  // Live-validate touched fields
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

  const updateField = useCallback((field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const blurField = useCallback((field: keyof ShippingForm) => {
    setTouched((prev) => new Set(prev).add(field))
  }, [])

  const selectPack = useCallback((pack: Pack) => {
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
  }, [selected.id])

  const sign = useCallback(async () => {
    if (phase === "submitting" || phase === "sealed") return

    const allErrors = validateForm(form)
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setTouched(new Set(Object.keys(form)))
      // Surface a recoverable error so consumer can scroll the form into view
      setPayError("Complete the sigil. Some fields are missing.")
      setPhase("error")
      return
    }

    if (!razorpayKey || typeof window === "undefined" || !window.Razorpay) {
      setPayError("Payment gateway is not configured.")
      setPhase("error")
      return
    }

    setPayError(null)
    setPhase("submitting")

    trackPixel("InitiateCheckout", {
      value: selected.price,
      currency: "INR",
      content_ids: [selected.id],
      content_name: selected.title,
      content_type: "product",
      num_items: selected.qty,
      contents: [{ id: selected.id, quantity: 1, item_price: selected.price }],
    })
    trackPixel("AddToCart", {
      value: selected.price,
      currency: "INR",
      content_ids: [selected.id],
      content_name: selected.title,
      content_type: "product",
      num_items: selected.qty,
    })

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
            try { localStorage.removeItem("unholy_cart") } catch {}
            setReceiptToken(verification.receiptToken)
            setPhase("sealed")
          } catch (error: any) {
            setPayError(error?.message || "Payment verification failed.")
            setPhase("error")
          }
        },
        theme: { color: "#B00020" },
        modal: {
          ondismiss: () => {
            setPhase((prev) => (prev === "submitting" ? "idle" : prev))
          },
        },
      })
      rz.on("payment.failed", (resp: any) => {
        const reason = resp?.error?.description || "Payment was declined. Try a different method."
        setPayError(reason)
        setPhase("error")
      })
      rz.open()
    } catch (e: any) {
      setPayError(e?.message || "Payment failed to initialize.")
      setPhase("error")
    }
  }, [form, phase, razorpayKey, selected])

  const goToReceipt = useCallback(() => {
    if (!receiptToken) return
    navigate(`/thanks?receipt=${encodeURIComponent(receiptToken)}`)
  }, [navigate, receiptToken])

  return {
    selected,
    selectPack,
    form,
    errors,
    updateField,
    blurField,
    phase,
    payError,
    sign,
    receiptToken,
    goToReceipt,
    isSealed: phase === "sealed",
    isSubmitting: phase === "submitting",
  }
}
