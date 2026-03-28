import type { Metadata } from "next"
import { OrdersClient } from "./OrdersClient"

export const metadata: Metadata = {
  title: "Order History",
  description: "Look up your UNHOLY CO. order history by email.",
  alternates: { canonical: "/orders" },
  robots: { index: false },
}

export default function OrdersPage() {
  return <OrdersClient />
}
