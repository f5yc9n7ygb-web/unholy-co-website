import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/server/supabase", () => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSupabaseReservationById: vi.fn(),
  restoreConsumedSupabaseReservation: vi.fn(() => Promise.resolve(true)),
  insertSupabaseReservation: vi.fn(() => Promise.resolve(null)),
  transitionSupabaseReservation: vi.fn(),
}))
vi.mock("@/lib/server/inventory", () => ({
  releaseStockByPack: vi.fn(() => Promise.resolve()),
}))

import { consumeReservation, releaseReservation } from "./reservations"
import { transitionSupabaseReservation } from "@/lib/server/supabase"
import { getSupabaseReservationById } from "@/lib/server/supabase"
import { releaseStockByPack } from "@/lib/server/inventory"

const transition = vi.mocked(transitionSupabaseReservation)
const getReservation = vi.mocked(getSupabaseReservationById)
const releaseCounter = vi.mocked(releaseStockByPack)

const row = (overrides: Partial<{ pack_id: string; quantity: number }> = {}) => ({
  reservation_id: "order_1",
  razorpay_order_id: "order_1",
  pack_id: overrides.pack_id ?? "pack6",
  quantity: overrides.quantity ?? 6,
  customer_email: "a@b.com",
  status: "released" as const,
  expires_at: new Date().toISOString(),
})

afterEach(() => vi.clearAllMocks())

describe("releaseReservation — release exactly once", () => {
  it("releases the counter when it wins the atomic transition", async () => {
    transition.mockResolvedValueOnce(row())
    const ok = await releaseReservation("order_1", null)
    expect(ok).toBe("released")
    expect(releaseCounter).toHaveBeenCalledWith("pack6", 6, null)
  })

  it("does NOT release the counter again once already released (no over-release)", async () => {
    transition.mockResolvedValueOnce(null) // guard matched 0 rows — already released
    getReservation.mockResolvedValueOnce(row())
    const ok = await releaseReservation("order_1", null)
    expect(ok).toBe("settled")
    expect(releaseCounter).not.toHaveBeenCalled()
  })

  it("returns false (no counter touch) for an unknown/consumed reservation", async () => {
    transition.mockResolvedValueOnce(null)
    getReservation.mockResolvedValueOnce(null)
    const ok = await releaseReservation("order_missing", null)
    expect(ok).toBe("missing")
    expect(releaseCounter).not.toHaveBeenCalled()
  })
})

describe("consumeReservation", () => {
  it("transitions to consumed and never touches the counter (decrementStock owns the sale)", async () => {
    transition.mockResolvedValueOnce({ ...row(), status: "consumed" as any })
    await consumeReservation("order_1")
    expect(transition).toHaveBeenCalledWith("order_1", "consumed")
    expect(releaseCounter).not.toHaveBeenCalled()
  })

  it("a consumed reservation can no longer be released (transition guard returns null)", async () => {
    transition.mockResolvedValueOnce(null) // status is 'consumed', not 'reserved'
    getReservation.mockResolvedValueOnce({ ...row(), status: "consumed" })
    const ok = await releaseReservation("order_1", null)
    expect(ok).toBe("settled")
    expect(releaseCounter).not.toHaveBeenCalled()
  })
})
