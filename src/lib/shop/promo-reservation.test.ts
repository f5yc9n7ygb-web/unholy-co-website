import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/server/supabase", () => ({
  reservePromoUsageSupabase: vi.fn(),
  linkPromoReservation: vi.fn(() => Promise.resolve()),
  consumePromoReservationByOrder: vi.fn(),
  releasePromoReservationByOrder: vi.fn(),
  getSupabasePromoCode: vi.fn(),
  incrementSupabasePromoUsageAtomic: vi.fn(),
  updateSupabasePromoCode: vi.fn(),
}))
vi.mock("@/lib/server/integrations", () => ({
  hasAirtableOrdersConfig: vi.fn(() => false),
  getRequiredEnv: vi.fn(() => ""),
  queryAirtableRecords: vi.fn(() => Promise.resolve([])),
  updateAirtableRecord: vi.fn(() => Promise.resolve()),
}))
vi.mock("@/lib/server/security", () => ({
  escapeAirtableValue: (v: string) => v,
}))

import {
  reservePromoUsage,
  consumePromoReservation,
  releasePromoReservation,
} from "./promo"
import {
  reservePromoUsageSupabase,
  consumePromoReservationByOrder,
  releasePromoReservationByOrder,
} from "@/lib/server/supabase"

const reserveRpc = vi.mocked(reservePromoUsageSupabase)
const consumeRpc = vi.mocked(consumePromoReservationByOrder)
const releaseRpc = vi.mocked(releasePromoReservationByOrder)

afterEach(() => vi.clearAllMocks())

describe("reservePromoUsage — fan-out cap at order creation", () => {
  it("denies when the promo limit is reached (blocks the discounted order)", async () => {
    reserveRpc.mockResolvedValueOnce({ granted: false, reason: "limit_reached" })
    expect(await reservePromoUsage("LIMITED10", "ctx_1")).toBe("denied")
  })

  it("grants when a slot is available", async () => {
    reserveRpc.mockResolvedValueOnce({ granted: true, reason: "reserved" })
    expect(await reservePromoUsage("LIMITED10", "ctx_2")).toBe("granted")
  })

  it("grants built-in/unlimited codes without hitting the RPC", async () => {
    expect(await reservePromoUsage("SINNER", "ctx_3")).toBe("granted")
    expect(reserveRpc).not.toHaveBeenCalled()
  })

  it("degrades to granted when the Supabase RPC is unavailable (pre-migration)", async () => {
    reserveRpc.mockResolvedValueOnce(null)
    expect(await reservePromoUsage("LIMITED10", "ctx_4")).toBe("granted")
  })
})

describe("consume / release promo reservation", () => {
  it("consume returns true when a reserved slot is settled (skip legacy increment)", async () => {
    consumeRpc.mockResolvedValueOnce(true)
    expect(await consumePromoReservation("order_1")).toBe(true)
  })

  it("consume returns false when there was no reservation (legacy fallback)", async () => {
    consumeRpc.mockResolvedValueOnce(false)
    expect(await consumePromoReservation("order_1")).toBe(false)
  })

  it("release returns true when it wins the only-once transition", async () => {
    releaseRpc.mockResolvedValueOnce(true)
    expect(await releasePromoReservation("order_1")).toBe(true)
  })

  it("release returns false when already released (no double-decrement)", async () => {
    releaseRpc.mockResolvedValueOnce(false)
    expect(await releasePromoReservation("order_1")).toBe(false)
  })
})
