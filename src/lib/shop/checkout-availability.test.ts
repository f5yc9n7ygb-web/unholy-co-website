import { describe, expect, it } from "vitest"
import { SIN_CHECKOUT_PACK_IDS, isPackAllowedForCheckoutSource } from "./checkout-availability"

describe("checkout availability", () => {
  it("blocks hidden trial packs on the sin checkout surface", () => {
    expect(isPackAllowedForCheckoutSource("sin", "pack1")).toBe(false)
    expect(isPackAllowedForCheckoutSource("sin", "pack3")).toBe(false)
  })

  it("allows shipping-ready and stunt packs on the sin checkout surface", () => {
    expect(SIN_CHECKOUT_PACK_IDS).toContain("donotbuy")
    expect(isPackAllowedForCheckoutSource("sin", "pack6")).toBe(true)
    expect(isPackAllowedForCheckoutSource("sin", "pack12")).toBe(true)
    expect(isPackAllowedForCheckoutSource("sin", "pack24")).toBe(true)
    expect(isPackAllowedForCheckoutSource("sin", "donotbuy")).toBe(true)
  })

  it("leaves non-sin checkout surfaces governed by the normal catalog", () => {
    expect(isPackAllowedForCheckoutSource("", "pack1")).toBe(true)
    expect(isPackAllowedForCheckoutSource("shop", "pack3")).toBe(true)
  })
})
