import { describe, expect, it } from "vitest"
import { decidePaymentFulfilment } from "./payment-status"

describe("decidePaymentFulfilment (captured-only gate)", () => {
  it("fulfils captured payments", () => {
    expect(decidePaymentFulfilment("captured")).toBe("fulfil")
  })

  it("defers authorized payments — must NOT fulfil (webhook drives capture)", () => {
    expect(decidePaymentFulfilment("authorized")).toBe("pending")
  })

  it("rejects every non-captured/non-authorized status", () => {
    for (const status of ["failed", "created", "refunded", "pending", ""]) {
      expect(decidePaymentFulfilment(status)).toBe("reject")
    }
  })
})
