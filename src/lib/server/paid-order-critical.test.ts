import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/server/inventory", () => ({ decrementStock: vi.fn() }))
vi.mock("@/lib/server/reservations", () => ({
  consumeReservation: vi.fn(),
  restoreConsumedReservation: vi.fn(() => Promise.resolve()),
}))

import { decrementStock } from "@/lib/server/inventory"
import { consumeReservation, restoreConsumedReservation } from "@/lib/server/reservations"
import { settlePaidOrderCritical } from "./paid-order-critical"

const consume = vi.mocked(consumeReservation)
const decrement = vi.mocked(decrementStock)
const restore = vi.mocked(restoreConsumedReservation)

afterEach(() => vi.clearAllMocks())

describe("settlePaidOrderCritical", () => {
  it("moves stock once and then settles promo", async () => {
    consume.mockResolvedValueOnce("consumed")
    const settlePromo = vi.fn(() => Promise.resolve())

    await settlePaidOrderCritical({
      orderId: "order_1",
      packId: "pack3",
      quantity: 3,
      settlePromo,
    })

    expect(decrement).toHaveBeenCalledOnce()
    expect(settlePromo).toHaveBeenCalledOnce()
  })

  it("skips a second stock move when a retry finds a consumed reservation", async () => {
    consume.mockResolvedValueOnce("already_consumed")

    await settlePaidOrderCritical({
      orderId: "order_1",
      packId: "pack3",
      quantity: 3,
      settlePromo: vi.fn(() => Promise.resolve()),
    })

    expect(decrement).not.toHaveBeenCalled()
  })

  it("restores the reservation when inventory mutation fails", async () => {
    consume.mockResolvedValueOnce("consumed")
    decrement.mockRejectedValueOnce(new Error("inventory unavailable"))

    await expect(settlePaidOrderCritical({
      orderId: "order_1",
      packId: "pack3",
      quantity: 3,
      settlePromo: vi.fn(() => Promise.resolve()),
    })).rejects.toThrow("inventory unavailable")

    expect(restore).toHaveBeenCalledWith("order_1")
  })
})
