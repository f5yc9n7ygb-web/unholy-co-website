"use client"

import { useEffect, useMemo, useState } from "react"

import { CHECKOUT_ADD_ON_CONFIG, type NoteTone } from "@/lib/shop/addon-config"
import type { CheckoutAddOn } from "./useRitualCheckout"

const STORAGE_KEY = "bloodthirst_checkout_add_ons_v1"

type AddOnDraft = {
  noteEnabled: boolean
  ledgerEnabled: boolean
  noteTone: NoteTone
  recipientName: string
  noteContext: string
  ledgerName: string
  ledgerCity: string
  ledgerConfession: string
  ledgerConsent: boolean
}

const EMPTY_DRAFT: AddOnDraft = {
  noteEnabled: false,
  ledgerEnabled: false,
  noteTone: "Funny",
  recipientName: "",
  noteContext: "",
  ledgerName: "",
  ledgerCity: "",
  ledgerConfession: "",
  ledgerConsent: false,
}

/**
 * @param storageKey localStorage key for the add-on draft. Defaults to the
 * site-wide key shared by /bloodthirst-shop + mobile. Surfaces with their own
 * isolated cart (e.g. /sin's private `unholy_cart_sin`) should pass a matching
 * private key so add-on state can't leak across pages.
 */
export function useCheckoutAddOnDraft(storageKey: string = STORAGE_KEY) {
  const [draft, setDraft] = useState<AddOnDraft>(EMPTY_DRAFT)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setDraft((current) => ({ ...current, ...JSON.parse(saved) }))
    } catch {
      // Checkout remains usable when storage is unavailable or malformed.
    }
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!hydrated) return
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft))
      } catch {
        // Persistence is a convenience, not a checkout dependency.
      }
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [draft, hydrated, storageKey])

  const checkoutAddOns = useMemo<CheckoutAddOn[]>(() => {
    const items: CheckoutAddOn[] = []
    if (draft.noteEnabled) {
      const note = CHECKOUT_ADD_ON_CONFIG.cursed_note
      items.push({
        id: note.id,
        title: note.title,
        price: note.price,
        data: {
          tone: draft.noteTone,
          recipientName: draft.recipientName,
          context: draft.noteContext,
        },
      })
    }
    if (draft.ledgerEnabled && draft.ledgerConsent) {
      const ledger = CHECKOUT_ADD_ON_CONFIG.unholy_ledger
      items.push({
        id: ledger.id,
        title: ledger.title,
        price: ledger.price,
        data: {
          displayName: draft.ledgerName,
          city: draft.ledgerCity,
          confession: draft.ledgerConfession,
          consent: true,
        },
      })
    }
    return items
  }, [draft])

  const bind = <Key extends keyof AddOnDraft>(key: Key) =>
    (value: AddOnDraft[Key]) => setDraft((current) => ({ ...current, [key]: value }))

  return {
    ...draft,
    setNoteEnabled: bind("noteEnabled"),
    setLedgerEnabled: bind("ledgerEnabled"),
    setNoteTone: bind("noteTone"),
    setRecipientName: bind("recipientName"),
    setNoteContext: bind("noteContext"),
    setLedgerName: bind("ledgerName"),
    setLedgerCity: bind("ledgerCity"),
    setLedgerConfession: bind("ledgerConfession"),
    setLedgerConsent: bind("ledgerConsent"),
    checkoutAddOns,
  }
}
