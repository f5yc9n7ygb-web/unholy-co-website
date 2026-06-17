import type { CheckoutAddOnId } from "./addons"

type AddOnField =
  | { key: "tone"; label: string; kind: "select"; options: readonly string[] }
  | { key: "recipientName" | "context" | "displayName" | "city" | "confession"; label: string; kind: "text" | "textarea" }
  | { key: "consent"; label: string; kind: "checkbox" }

export const NOTE_TONES = [
  "Funny",
  "Romantic",
  "Roast Them",
  "Beg Them To Come Back",
  "Send To Your Ex",
  "Surprise Me",
] as const

export type NoteTone = (typeof NOTE_TONES)[number]

export const CHECKOUT_ADD_ON_CONFIG = {
  cursed_note: {
    id: "cursed_note",
    title: "Cursed Note",
    price: 99,
    fields: [
      { key: "tone", label: "Tone", kind: "select", options: NOTE_TONES },
      { key: "recipientName", label: "Recipient name", kind: "text" },
      { key: "context", label: "Extra context", kind: "textarea" },
    ],
  },
  unholy_ledger: {
    id: "unholy_ledger",
    title: "The Unholy Ledger",
    price: 666,
    fields: [
      { key: "displayName", label: "Display name or Instagram handle", kind: "text" },
      { key: "city", label: "City", kind: "text" },
      { key: "confession", label: "Optional confession", kind: "textarea" },
      {
        key: "consent",
        label: "I allow BloodThirst to publicly display my chosen name/handle, city, and confession in The Unholy Ledger.",
        kind: "checkbox",
      },
    ],
  },
} as const satisfies Record<CheckoutAddOnId, {
  id: CheckoutAddOnId
  title: string
  price: number
  fields: readonly AddOnField[]
}>

export function isCheckoutAddOnId(id: string): id is CheckoutAddOnId {
  return id === "cursed_note" || id === "unholy_ledger"
}
