import { describe, expect, it } from "vitest"

import { readCheckoutAddOns } from "./addons"
import {
  INDIAN_STATES_AND_UNION_TERRITORIES,
  isValidIndianMobile,
  normalizeIndianPhone,
} from "./checkout-validation"

describe("checkout validation", () => {
  it("normalizes common Indian mobile formats", () => {
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("9876543210")
    expect(normalizeIndianPhone("09876543210")).toBe("9876543210")
    expect(isValidIndianMobile("+91-98765-43210")).toBe(true)
    expect(isValidIndianMobile("12345")).toBe(false)
  })

  it("includes all union territories needed for delivery", () => {
    for (const territory of [
      "Andaman and Nicobar Islands",
      "Chandigarh",
      "Dadra and Nagar Haveli and Daman and Diu",
      "Jammu and Kashmir",
      "Ladakh",
      "Lakshadweep",
      "Puducherry",
    ]) {
      expect(INDIAN_STATES_AND_UNION_TERRITORIES).toContain(territory)
    }
  })
})

describe("checkout add-on canonicalization", () => {
  it("ignores client-supplied title and price", () => {
    const [addOn] = readCheckoutAddOns([{
      id: "unholy_ledger",
      title: "Free ledger",
      price: 0,
      data: { displayName: "Sinner", city: "Jaipur", consent: true },
    }])

    expect(addOn).toMatchObject({
      id: "unholy_ledger",
      title: "The Unholy Ledger",
      price: 666,
    })
  })
})
