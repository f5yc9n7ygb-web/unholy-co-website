import { describe, expect, it } from "vitest"
import { redactOrderContact } from "./redact"

describe("redactOrderContact (order-ID-only track mode)", () => {
  it("strips email and phone so an order ID alone cannot harvest contact PII", () => {
    const out = redactOrderContact({
      orderId: "order_ABC123",
      customerEmail: "victim@example.com",
      customerPhone: "9999999999",
      amount: 699,
      shippingStatus: "Processing",
    })
    expect(out.customerEmail).toBe("")
    expect(out.customerPhone).toBe("")
  })

  it("preserves non-PII tracking fields", () => {
    const out = redactOrderContact({
      orderId: "order_ABC123",
      customerEmail: "victim@example.com",
      customerPhone: "9999999999",
      amount: 699,
      shippingStatus: "Shipped",
    })
    expect(out.orderId).toBe("order_ABC123")
    expect(out.amount).toBe(699)
    expect(out.shippingStatus).toBe("Shipped")
  })
})
