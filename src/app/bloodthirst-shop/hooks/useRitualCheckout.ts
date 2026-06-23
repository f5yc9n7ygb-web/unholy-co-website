"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PACKS, type Pack } from "@/lib/shop/catalog"
import { createReceiptPricing, readReceiptPricing, type ReceiptPricing } from "@/lib/shop/receipt"
import type { ShippingForm } from "@/lib/shop/types"
import { generateEventId, trackPixel } from "@/lib/meta-pixel"
import {
  INDIAN_STATES_AND_UNION_TERRITORIES,
  isValidIndianMobile,
} from "@/lib/shop/checkout-validation"
import { usePageTransition } from "@/context/TransitionContext"

declare global {
  interface Window {
    Razorpay: any
  }
}

export type FormErrors = Partial<Record<keyof ShippingForm, string>>

export type CheckoutPhase = "idle" | "submitting" | "sealed" | "error"

/** Why the checkout errored. "validation" = the user just missed a field
 * (recoverable, no support needed); "system" = a real gateway/payment/verify
 * failure where offering "contact support" is appropriate. */
export type CheckoutErrorKind = "validation" | "system"

export type AppliedPromo = {
  code: string
  discountType: "percentage" | "flat"
  discountValue: number
  discountAmount: number
  finalPrice: number
  promoRecordId: string
}

export type CheckoutAddOn = {
  id: "cursed_note" | "unholy_ledger"
  title: string
  price: number
  data?: Record<string, unknown>
}

export const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/

export const INDIAN_STATES = INDIAN_STATES_AND_UNION_TERRITORIES

export function validateForm(form: ShippingForm): FormErrors {
  // The order of error insertion equals the visual DOM order and the focus-jump order, so future edits should preserve it.
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = "Name is required"
  if (!form.email.trim()) errors.email = "Email is required"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email"
  if (!form.phone.trim()) errors.phone = "Phone is required"
  else if (!isValidIndianMobile(form.phone))
    errors.phone = "Enter 10-digit mobile number"
  if (!form.address.trim()) errors.address = "Address is required"
  if (!form.city.trim()) errors.city = "City is required"
  if (!form.pincode.trim()) errors.pincode = "Pincode is required"
  else if (!/^\d{6}$/.test(form.pincode.trim()))
    errors.pincode = "Enter valid 6-digit pincode"
  if (!form.state) errors.state = "State is required"
  if (form.gstNumber && !GSTIN_REGEX.test(form.gstNumber)) {
    errors.gstNumber = "Enter a valid GSTIN"
  }
  return errors
}

const EMPTY_FORM: ShippingForm = {
  name: "", email: "", phone: "", address: "", city: "", pincode: "", state: "", gstNumber: "",
}

type Args = {
  razorpayKey?: string
  /** Per-page starting pack (e.g. /buy anchors cold traffic on the 6-pack). Saved carts still win. */
  defaultPackId?: string
  /**
   * localStorage cart key. Defaults to the site-wide "unholy_cart" (shared by
   * /shop, /buy, /bloodthirst-shop). A page that advertises its own anchor —
   * e.g. /sin's deliberately lower ₹699 hero — passes a PRIVATE key so a cart
   * saved on another surface (like /buy's ₹1,200 pack6) can't silently override
   * the pack it shows, which would make the hero price and checkout disagree.
   */
  storageKey?: string
  checkoutAddOns?: CheckoutAddOn[]
  /** Mobile ritual fires AddToCart when a pack is actively selected. */
  addToCartOnPackSelect?: boolean
  /** Mobile ritual suppresses the later pre-Razorpay AddToCart to avoid double counting. */
  suppressCheckoutAddToCart?: boolean
}

const DEFAULT_PACK = PACKS.find((p) => p.id === "pack6") || PACKS[0]

export function useRitualCheckout({
  razorpayKey,
  defaultPackId,
  storageKey = "unholy_cart",
  checkoutAddOns = [],
  addToCartOnPackSelect = false,
  suppressCheckoutAddToCart = false,
}: Args) {
  const { navigate } = usePageTransition()

  const [selected, setSelected] = useState<Pack>(
    () => PACKS.find((p) => p.id === defaultPackId) || DEFAULT_PACK
  )
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [cartHydrated, setCartHydrated] = useState(false)
  const [phase, setPhase] = useState<CheckoutPhase>("idle")
  const [payError, setPayError] = useState<string | null>(null)
  const [payErrorKind, setPayErrorKind] = useState<CheckoutErrorKind | null>(null)
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [serverPricing, setServerPricing] = useState<ReceiptPricing | null>(null)
  const [receiptToken, setReceiptToken] = useState<string | null>(null)
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null)
  const viewContentFired = useRef(false)
  const addToCartFired = useRef<string | null>(null)
  const addToCartEventIds = useRef<Record<string, string>>({})
  const addOnSignature = checkoutAddOns.map((item) => `${item.id}:${item.price}`).join("|")

  const addOnTotal = checkoutAddOns.reduce((sum, item) => sum + item.price, 0)
  const grossTotal = selected.price + addOnTotal
  const pricing = serverPricing || createReceiptPricing(grossTotal, appliedPromo?.discountAmount)
  const effectiveTotal = pricing.total

  useEffect(() => {
    setServerPricing(null)
    setAppliedPromo(null)
    addToCartFired.current = null
    addToCartEventIds.current = {}
  }, [addOnSignature])

  // Restore cart on mount (key defaults to the site-wide "unholy_cart"; pages
  // with their own anchor pass a private storageKey). ViewContent waits for this
  // effect so server markup and the first client render keep the same pack.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
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
    setCartHydrated(true)
  }, [storageKey])

  // Persist
  useEffect(() => {
    if (!cartHydrated) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ packId: selected.id, shipping: form })
        )
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(t)
  }, [cartHydrated, selected, form, storageKey])

  useEffect(() => {
    if (!cartHydrated || viewContentFired.current) return
    viewContentFired.current = true
    trackPixel(
      "ViewContent",
      {
        value: selected.price,
        currency: "INR",
        content_ids: [selected.id],
        content_name: selected.title,
        content_type: "product",
        num_items: selected.qty,
        contents: [{ id: selected.id, quantity: 1, item_price: selected.price }],
      },
      generateEventId(),
    )
  }, [cartHydrated, selected])

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
    setPayError(null)
  }, [])

  const blurField = useCallback((field: keyof ShippingForm) => {
    setTouched((prev) => new Set(prev).add(field))
  }, [])

  const trackAddToCart = useCallback((pack: Pack, value: number) => {
    const cartSignature = `${pack.id}:${value}`
    if (addToCartFired.current === cartSignature) return
    addToCartFired.current = cartSignature
    const eventId = addToCartEventIds.current[cartSignature] || generateEventId()
    addToCartEventIds.current[cartSignature] = eventId
    trackPixel(
      "AddToCart",
      {
        value,
        currency: "INR",
        content_ids: [pack.id],
        content_name: pack.title,
        content_type: "product",
        num_items: pack.qty,
        contents: [{ id: pack.id, quantity: 1, item_price: value }],
      },
      eventId,
    )
  }, [])

  const trackCurrentAddToCart = useCallback(() => {
    trackAddToCart(selected, effectiveTotal)
  }, [effectiveTotal, selected, trackAddToCart])

  const selectPack = useCallback((pack: Pack) => {
    if (pack.id === selected.id) return
    setSelected(pack)
    setAppliedPromo(null)
    setServerPricing(null)
    addToCartFired.current = null
    trackPixel(
      "ViewContent",
      {
        value: pack.price,
        currency: "INR",
        content_ids: [pack.id],
        content_name: pack.title,
        content_type: "product",
        num_items: pack.qty,
        contents: [{ id: pack.id, quantity: 1, item_price: pack.price }],
      },
      generateEventId(),
    )
    if (addToCartOnPackSelect) {
      trackAddToCart(pack, pack.price + addOnTotal)
    }
  }, [addOnTotal, addToCartOnPackSelect, selected.id, trackAddToCart])

  const applyPromo = useCallback((promo: AppliedPromo) => {
    setAppliedPromo(promo)
    setServerPricing(null)
    addToCartFired.current = null
  }, [])

  const removePromo = useCallback(() => {
    setAppliedPromo(null)
    setServerPricing(null)
    addToCartFired.current = null
  }, [])

  const sign = useCallback(async () => {
    if (phase === "submitting" || phase === "sealed") return

    const allErrors = validateForm(form)
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setTouched(new Set(Object.keys(form)))
      // Surface a recoverable error so consumer can scroll the form into view
      setPayError("Complete the sigil. Some fields are missing.")
      setPayErrorKind("validation")
      setPhase("error")

      const firstField = Object.keys(allErrors)[0]
      if (firstField && typeof document !== "undefined") {
        requestAnimationFrame(() => {
          const el = document.getElementById(`rf-${firstField}`)
          el?.scrollIntoView({ block: "center", behavior: "smooth" })
          el?.focus({ preventScroll: true })
        })
      }
      return
    }

    if (!razorpayKey || typeof window === "undefined" || !window.Razorpay) {
      setPayError("Payment gateway is not configured.")
      setPayErrorKind("system")
      setPhase("error")
      return
    }

    setPayError(null)
    setPayErrorKind(null)
    setPhase("submitting")

    if (!suppressCheckoutAddToCart) {
      trackAddToCart(selected, effectiveTotal)
    }

    trackPixel(
      "InitiateCheckout",
      {
        value: effectiveTotal,
        currency: "INR",
        content_ids: [selected.id],
        content_name: selected.title,
        content_type: "product",
        num_items: selected.qty,
        contents: [{ id: selected.id, quantity: 1, item_price: effectiveTotal }],
      },
      generateEventId(),
    )

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: selected.id,
          shipping: form,
          promoCode: appliedPromo?.code || undefined,
          promoRecordId: appliedPromo?.promoRecordId || undefined,
          addOns: checkoutAddOns.map((item) => ({
            id: item.id,
            data: item.data || {},
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to start checkout right now.")
      }
      const orderPricing = readReceiptPricing(data.order.pricing)
      if (orderPricing) {
        setServerPricing(orderPricing)
      }
      const orderAmount = Number(data.order.amount)

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
            if (typeof verification.receiptToken !== "string" || !verification.receiptToken) {
              throw new Error("Your payment was verified, but the receipt could not be opened. Please contact rituals@theunholy.co")
            }
            try { localStorage.removeItem(storageKey) } catch {}
            setConfirmedTotal(
              Number.isFinite(orderAmount) && orderAmount > 0
                ? orderAmount / 100
                : effectiveTotal
            )
            setReceiptToken(verification.receiptToken)
            setPhase("sealed")
          } catch (error: any) {
            setPayError(error?.message || "Payment verification failed.")
            setPayErrorKind("system")
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
        setPayErrorKind("system")
        setPhase("error")
      })
      rz.open()
    } catch (e: any) {
      setPayError(e?.message || "Payment failed to initialize.")
      setPayErrorKind("system")
      setPhase("error")
    }
  }, [appliedPromo, checkoutAddOns, effectiveTotal, form, phase, razorpayKey, selected, storageKey, suppressCheckoutAddToCart, trackAddToCart])

  const goToReceipt = useCallback(() => {
    if (!receiptToken) return
    navigate("/thanks")
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
    payErrorKind,
    appliedPromo,
    pricing,
    grossTotal,
    addOnTotal,
    applyPromo,
    removePromo,
    effectiveTotal,
    confirmedTotal: confirmedTotal ?? effectiveTotal,
    sign,
    receiptToken,
    goToReceipt,
    trackCurrentAddToCart,
    isSealed: phase === "sealed",
    isSubmitting: phase === "submitting",
  }
}
