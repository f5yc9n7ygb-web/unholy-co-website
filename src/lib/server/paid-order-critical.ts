import type { KVNamespace } from "@/lib/server/kv"
import { decrementStock } from "@/lib/server/inventory"
import { consumeReservation, restoreConsumedReservation } from "@/lib/server/reservations"

export async function settlePaidOrderCritical(options: {
  orderId: string
  packId: string
  quantity: number
  kv?: KVNamespace | null
  settlePromo: () => Promise<void>
}): Promise<void> {
  const reservation = await consumeReservation(options.orderId)
  if (reservation === "unavailable") {
    throw new Error(`Reservation ledger unavailable for ${options.orderId}`)
  }

  // A consumed row is the durable marker that stock already moved. This lets a
  // failed promo settlement retry without decrementing inventory a second time.
  if (reservation !== "already_consumed") {
    try {
      await decrementStock(options.packId, options.quantity, options.orderId, options.kv)
    } catch (error) {
      if (reservation === "consumed") {
        await restoreConsumedReservation(options.orderId).catch((restoreError) => {
          console.error("Failed to restore reservation after inventory error:", restoreError)
        })
      }
      throw error
    }
  }

  await options.settlePromo()
}
