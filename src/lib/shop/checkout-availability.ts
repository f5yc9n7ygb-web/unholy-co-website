import { SIN_AVAILABLE_PACK_IDS } from "@/content/sin"

export const SIN_CHECKOUT_PACK_IDS = [...SIN_AVAILABLE_PACK_IDS, "donotbuy"] as const

const SIN_ORDER_PACK_IDS = new Set<string>(SIN_CHECKOUT_PACK_IDS)

export function isPackAllowedForCheckoutSource(source: string, packId: string) {
  if (source === "sin") {
    return SIN_ORDER_PACK_IDS.has(packId)
  }

  return Boolean(packId)
}
