import { ShopClient } from "./ShopClient"

export const metadata = {
  title: "Shop BloodThirst — UNHOLY CO.",
  description: "Order BloodThirst cans directly from the coven. Choose your ritual pack and get cold-forged hydration delivered."
}

/**
 * The server-side component for the shop page.
 * This component primarily renders the `ShopClient` component, which handles the interactive parts of the shop.
 *
 * @returns {JSX.Element} The rendered `ShopClient` component.
 */
export default function ShopPage() {
  return <ShopClient />
}
