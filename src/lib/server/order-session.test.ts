import { beforeAll, describe, expect, it } from "vitest"
import {
  createReceiptToken,
  readReceiptToken,
  readOrderSessionToken,
} from "./order-session"

beforeAll(() => {
  // Signing secret is read lazily inside the module; set a deterministic one.
  process.env.SECURITY_SIGNING_SECRET = "vitest-only-signing-secret-not-production"
})

describe("order-session signed tokens", () => {
  it("roundtrips a receipt token", () => {
    const token = createReceiptToken({ packId: "pack3", qty: 3, orderId: "order_test" })
    const payload = readReceiptToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.orderId).toBe("order_test")
    expect(payload?.packId).toBe("pack3")
  })

  it("rejects a tampered signature", () => {
    const token = createReceiptToken({ packId: "pack3", qty: 3, orderId: "order_test" })
    const [encoded] = token.split(".")
    expect(readReceiptToken(`${encoded}.deadbeef`)).toBeNull()
  })

  it("rejects a tampered payload", () => {
    const token = createReceiptToken({ packId: "pack3", qty: 3, orderId: "order_test" })
    const [, signature] = token.split(".")
    const forgedPayload = Buffer.from(
      JSON.stringify({ type: "thanks-receipt", issuedAt: Date.now(), payload: { packId: "pack24", qty: 99 } })
    ).toString("base64url")
    expect(readReceiptToken(`${forgedPayload}.${signature}`)).toBeNull()
  })

  it("binds a token to its declared type", () => {
    const receipt = createReceiptToken({ packId: "pack3", qty: 3 })
    // A receipt token must not validate as an order-session token.
    expect(readOrderSessionToken(receipt)).toBeNull()
    expect(readReceiptToken(receipt)).not.toBeNull()
  })
})
