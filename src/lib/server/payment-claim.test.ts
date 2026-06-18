import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/server/supabase", () => ({
  claimPaymentProcessing: vi.fn(),
  completePaymentProcessing: vi.fn(() => Promise.resolve()),
  failPaymentProcessing: vi.fn(() => Promise.resolve()),
}))
vi.mock("@/lib/server/order-session", () => ({
  claimProcessedPayment: vi.fn(),
  releaseProcessedPayment: vi.fn(() => Promise.resolve()),
}))

import {
  claimPaymentForProcessing,
  completePaymentClaim,
  failPaymentClaim,
} from "./payment-claim"
import { claimPaymentProcessing, failPaymentProcessing } from "@/lib/server/supabase"
import { claimProcessedPayment, releaseProcessedPayment } from "@/lib/server/order-session"

const durableClaim = vi.mocked(claimPaymentProcessing)
const kvClaim = vi.mocked(claimProcessedPayment)
const kvRelease = vi.mocked(releaseProcessedPayment)
const durableFail = vi.mocked(failPaymentProcessing)

afterEach(() => vi.clearAllMocks())

describe("claimPaymentForProcessing — concurrent verify + webhook", () => {
  it("grants to exactly one of two racing callers", async () => {
    durableClaim
      .mockResolvedValueOnce({ granted: true, state: "processing", attempts: 1 })
      .mockResolvedValueOnce({ granted: false, state: "processing", attempts: 1 })

    const [a, b] = await Promise.all([
      claimPaymentForProcessing("pay_race"),
      claimPaymentForProcessing("pay_race"),
    ])

    const grants = [a.granted, b.granted].filter(Boolean)
    expect(grants).toHaveLength(1)
    expect(kvClaim).not.toHaveBeenCalled() // durable path won, no KV fallback
  })

  it("denies a completed payment so it can never re-fulfil", async () => {
    durableClaim.mockResolvedValueOnce({ granted: false, state: "completed", attempts: 1 })
    const r = await claimPaymentForProcessing("pay_done")
    expect(r.granted).toBe(false)
    expect(r.state).toBe("completed")
  })

  it("re-grants a failed_retryable payment so a retry can proceed", async () => {
    durableClaim.mockResolvedValueOnce({ granted: true, state: "processing", attempts: 2 })
    const r = await claimPaymentForProcessing("pay_retry")
    expect(r.granted).toBe(true)
  })

  it("falls back to the KV claim when Supabase is unavailable", async () => {
    durableClaim.mockResolvedValueOnce(null)
    kvClaim.mockResolvedValueOnce(true)
    const r = await claimPaymentForProcessing("pay_x", null)
    expect(r.source).toBe("kv")
    expect(r.granted).toBe(true)
    expect(kvClaim).toHaveBeenCalledOnce()
  })
})

describe("failPaymentClaim", () => {
  it("transitions to failed_retryable and releases the KV claim for retry", async () => {
    await failPaymentClaim("pay_1", null, "persist boom")
    expect(durableFail).toHaveBeenCalledWith("pay_1", "persist boom")
    expect(kvRelease).toHaveBeenCalledWith("pay_1", null)
  })
})

describe("completePaymentClaim", () => {
  it("does not throw when Supabase mark fails", async () => {
    await expect(completePaymentClaim("pay_1")).resolves.toBeUndefined()
  })
})
