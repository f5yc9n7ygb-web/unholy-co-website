#!/usr/bin/env -S node -r ./scripts/register-ts-paths.cjs ./node_modules/sucrase/bin/sucrase-node

import { writeFile } from "node:fs/promises"
import { generateInvoicePdf } from "../src/lib/pdf/generate-invoice"

async function main() {
  const anvitaPdfBytes = await generateInvoicePdf({
    orderId: "order_SYeXZXiNo6UrEA",
    paymentId: "pay_SYeY5QP65ajPbA",
    pack: "Starter Ritual",
    quantity: 6,
    amount: 1080,
    customerName: "Anvita Constructions (I) Pvt Ltd",
    customerEmail: "aakashsingh@anvitaconstructions.in",
    customerPhone: "+918650868868",
    shippingAddress: "C-13, Bank Colony, Krishna Nagar",
    shippingCity: "Mathura",
    shippingState: "Uttar Pradesh",
    shippingPincode: "281004",
    timestamp: "2026-04-03T01:13:00+05:30",
    promoCode: "CULT10",
    discountAmount: 120,
    buyerGstNumber: "09AAHCA9517A1ZT",
    buyerBusinessName: "ANVITA CONSTRUCTIONS (I) PVT LTD",
    invoiceSeq: 31,
    invoiceNumber: "UHC/26-27/O6UREA/31",
  })

  await writeFile("/private/tmp/unholy-anvita-sample-invoice.pdf", anvitaPdfBytes)

  const manishPdfBytes = await generateInvoicePdf({
    orderId: "order_SYc2pxUSNVSjEx",
    paymentId: "pay_SYc7khGmT9rVpZ",
    pack: "Starter Ritual",
    quantity: 6,
    amount: 1080,
    customerName: "Manish Chaturvedi",
    customerEmail: "",
    customerPhone: "9929307024",
    shippingAddress: "Bajrang Gadh, 20, Ball Bairathi Nagar 2nd",
    shippingCity: "Mahesh Nagar, Jaipur",
    shippingState: "Rajasthan",
    shippingPincode: "302015",
    timestamp: "2026-04-02T23:25:00+05:30",
    invoiceSeq: 30,
    invoiceNumber: "UHC/26-27/NVSJEX/30",
  })

  await writeFile("/private/tmp/unholy-manish-sample-invoice.pdf", manishPdfBytes)

  const noDiscountPdfBytes = await generateInvoicePdf({
    orderId: "order_SAMPLE",
    paymentId: "pay_SAMPLE",
    pack: "Starter Ritual",
    quantity: 6,
    amount: 1200,
    customerName: "Sample Customer",
    customerEmail: "sample@example.com",
    customerPhone: "9999999999",
    shippingAddress: "C-12, Bank Colony, Krishna Nagar",
    shippingCity: "Mathura",
    shippingState: "Uttar Pradesh",
    shippingPincode: "281004",
    timestamp: "2026-04-02T12:00:00+05:30",
    invoiceSeq: 99,
    invoiceNumber: "UHC/26-27/SAMPLE/99",
  })

  await writeFile("/private/tmp/unholy-no-discount-sample-invoice.pdf", noDiscountPdfBytes)
  console.log("/private/tmp/unholy-anvita-sample-invoice.pdf")
  console.log("/private/tmp/unholy-manish-sample-invoice.pdf")
  console.log("/private/tmp/unholy-no-discount-sample-invoice.pdf")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
