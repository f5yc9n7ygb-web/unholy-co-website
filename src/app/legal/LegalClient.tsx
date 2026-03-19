"use client"

import { motion } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"

const sections = [
  {
    title: "Privacy Policy",
    body: [
      "When you sign up, place an order, or contact us, we may collect information such as your name, email address, phone number, shipping address, and any message you submit through the site.",
      "We use that information to run the website, fulfill orders, respond to inquiries, send transactional updates, and deliver marketing emails only where you have asked to receive them.",
      "We do not sell your personal information. We may share it only with service providers that help us operate the business, including payment, email, fulfillment, analytics, and customer support partners.",
      "You may request access, correction, or deletion of your information by emailing rituals@theunholy.co.",
    ],
  },
  {
    title: "Email and Marketing",
    body: [
      "If you join the UNHOLY CO. mailing list, you may receive launch announcements, restock alerts, product updates, and editorial brand content.",
      "Every marketing email should include a way to unsubscribe. You can also ask us to remove you manually by contacting rituals@theunholy.co.",
      "Transactional emails related to orders, support, or account activity may still be sent when necessary to complete a purchase or respond to your request.",
    ],
  },
  {
    title: "Orders, Shipping, and Fulfillment",
    body: [
      "Orders are subject to acceptance and stock availability. Submitting payment does not guarantee fulfillment until the order is confirmed by our systems.",
      "Shipping timelines shown on the site are estimates, not guarantees. Delivery windows may vary based on destination, carrier performance, weather, and high-volume periods.",
      "Customers are responsible for entering accurate contact and shipping details. UNHOLY CO. is not responsible for delays or losses caused by incorrect delivery information supplied at checkout.",
    ],
  },
  {
    title: "Returns, Refunds, and Cancellations",
    body: [
      "Because BloodThirst is a consumable product, opened or delivered units are generally not eligible for return unless the product arrives damaged, defective, or materially incorrect.",
      "If your order arrives damaged or incomplete, contact rituals@theunholy.co within 48 hours of delivery with your order details and clear supporting photos.",
      "Approved refunds, replacements, or credits are issued at our discretion after review. Unauthorized chargebacks or fraudulent disputes may result in future orders being refused.",
    ],
  },
  {
    title: "Website Terms",
    body: [
      "All site content, branding, copy, imagery, product names, and design elements are the property of UNHOLY CO. unless otherwise stated.",
      "You may not reproduce, distribute, scrape, modify, or commercially exploit any part of the website without written permission.",
      "We may update products, pricing, policies, site copy, and availability at any time without prior notice. Continued use of the site means you accept the latest published terms.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For privacy requests, support, wholesale inquiries, or policy questions, contact rituals@theunholy.co.",
      "Press requests can be sent to press@theunholy.co.",
      "This page is a general policy summary and may be refined as operations, fulfillment coverage, and compliance requirements evolve.",
    ],
  },
]

const fadeUp = (delay = 0) => ({
  initial: { y: 16 },
  animate: { y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export function LegalClient() {
  return (
    <div className="relative min-h-[90vh] overflow-hidden">
      {/* Ghost watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-start justify-end select-none overflow-hidden pr-8 pt-24 md:pt-32"
      >
        <span className="font-cinzel font-black text-[18vw] leading-none text-bone/[0.03]">
          LAW
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 md:py-36">

        {/* Header */}
        <motion.div {...fadeUp(0)} className="mb-16">
          <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-blood/60">
            Legal + Policy
          </p>
          <h1 className="font-cinzel text-4xl font-bold text-offwhite md:text-5xl lg:text-6xl">
            The fine print.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-bone/45 md:text-base">
            UNHOLY CO. sells BloodThirst through this website and related channels.
            These policies explain how we handle information, orders, and site usage.
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-bone/25">
            Last updated: March 14, 2026
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-0">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              {...fadeUp(0.08 + i * 0.06)}
            >
              <div className="h-px bg-blood/[0.15]" />
              <div className="py-10 md:grid md:grid-cols-[220px_1fr] md:gap-12">
                <div className="mb-4 md:mb-0">
                  <h2 className="font-cinzel text-sm font-bold text-offwhite/70">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-bone/50">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
          <div className="h-px bg-blood/[0.15]" />
        </div>

        {/* CTA */}
        <motion.div {...fadeUp(0.5)} className="mt-14 flex flex-wrap gap-4">
          <TransitionLink href="/" className="btn btn-ghost px-6 py-3 text-sm">
            Return Home
          </TransitionLink>
          <TransitionLink href="/contact" className="btn btn-ghost px-6 py-3 text-sm">
            Contact Us
          </TransitionLink>
        </motion.div>

      </div>
    </div>
  )
}
