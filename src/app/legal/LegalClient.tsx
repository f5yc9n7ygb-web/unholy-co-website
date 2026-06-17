"use client"

import { motion } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"
import {
  COMPANY_BRAND_NAME,
  COMPANY_FSSAI_LICENSE,
  COMPANY_GSTIN,
  COMPANY_LEGAL_NAME,
  COMPANY_PRESS_EMAIL,
  COMPANY_REGISTERED_ADDRESS,
  COMPANY_SUPPORT_EMAIL,
} from "@/lib/site/company"

const sections = [
  {
    title: "Seller Information",
    body: [
      `${COMPANY_BRAND_NAME} and BloodThirst are sold online by ${COMPANY_LEGAL_NAME}.`,
      `Registered office: ${COMPANY_REGISTERED_ADDRESS}.`,
      `GSTIN: ${COMPANY_GSTIN}. FSSAI Lic. No.: ${COMPANY_FSSAI_LICENSE}. For order support, privacy requests, and policy questions, contact ${COMPANY_SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: "Privacy Policy",
    body: [
      "When you sign up, place an order, or contact us, we may collect information such as your name, email address, phone number, shipping address, and any message you submit through the site.",
      "We use that information to run the website, fulfill orders, respond to inquiries, send transactional updates, and deliver marketing emails only where you have asked to receive them.",
      "We do not sell your personal information. We may share it only with service providers that help us operate the business, including payment, email, fulfillment, analytics, and customer support partners.",
      `You may request access, correction, or deletion of your information by emailing ${COMPANY_SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: "Email and Marketing",
    body: [
      `If you join the ${COMPANY_BRAND_NAME} mailing list, you may receive launch announcements, restock alerts, product updates, and editorial brand content.`,
      `Every marketing email should include a way to unsubscribe. You can also ask us to remove you manually by contacting ${COMPANY_SUPPORT_EMAIL}.`,
      "Transactional emails related to orders, support, or account activity may still be sent when necessary to complete a purchase or respond to your request.",
    ],
  },
  {
    title: "Orders and Payments",
    body: [
      "All prices are displayed in Indian Rupees. Unless stated otherwise, product prices shown at checkout are inclusive of applicable GST.",
      "Orders are subject to acceptance, stock availability, and payment verification. We may refuse, limit, or cancel an order where pricing errors, stock issues, suspected fraud, or operational constraints apply. If payment has already been captured for an order we cannot fulfill, the amount will be refunded to the original payment method.",
      "Payments are processed through third-party payment partners. We do not store full card details on our own servers.",
    ],
  },
  {
    title: "Shipping and Fulfillment",
    body: [
      "Shipping timelines shown on the site are estimates, not guarantees. Delivery windows may vary based on destination, carrier performance, weather, operational disruptions, and high-volume periods.",
      "Customers are responsible for entering accurate contact and shipping details. We are not responsible for delays, failed deliveries, or losses caused by incorrect delivery information supplied at checkout.",
      "Risk in the goods passes on delivery. If a shipment is returned because of an incorrect address, repeated failed delivery attempts, or refusal to accept the package, we may contact you to arrange redelivery at additional cost where applicable.",
    ],
  },
  {
    title: "Cancellations, Returns, and Refunds",
    body: [
      `If you need to cancel an order, email ${COMPANY_SUPPORT_EMAIL} immediately with your order ID and contact details. We can only review cancellation requests before an order is packed, handed to the courier, or marked as dispatched.`,
      "Once an order has been dispatched, it cannot usually be canceled except where required under applicable law. Approved pre-dispatch cancellations are refunded to the original payment method.",
      "Because BloodThirst is a consumable product, opened or delivered units are generally not eligible for return unless the product arrives damaged, defective, or materially incorrect.",
      `If your order arrives damaged, incomplete, defective, or materially different from what you purchased, contact ${COMPANY_SUPPORT_EMAIL} within 48 hours of delivery with your order details and clear supporting photos.`,
      "Approved refunds, replacements, or credits are issued after review. Refunds are typically processed within 5–7 business days to the original payment method. Unauthorized chargebacks or fraudulent disputes may result in future orders being refused.",
    ],
  },
  {
    title: "Website Terms and Acceptable Use",
    body: [
      `By using this website, you agree to use it only for lawful purposes and in a way that does not interfere with the website, our operations, or other customers.`,
      "You may not attempt unauthorized access, probe or bypass site security, introduce malicious code, scrape the site at scale, use bots to disrupt checkout or forms, or misuse any content or services made available on the website.",
      `All site content, branding, copy, imagery, product names, trademarks, and design elements are the property of ${COMPANY_BRAND_NAME} or our licensors unless otherwise stated.`,
      "You may not reproduce, distribute, modify, republish, create derivative works from, or commercially exploit any part of the website without prior written permission.",
      "We may update products, pricing, policies, site copy, and availability at any time. Continued use of the website after changes are published means you accept the updated terms.",
    ],
  },
  {
    title: "Limitation of Liability",
    body: [
      "To the fullest extent permitted by applicable law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, revenue, data, goodwill, or business opportunity arising from your use of the website, your inability to use it, or any delay, interruption, or technical failure affecting the service.",
      "Our total liability in connection with a claim relating to a specific order or transaction will not exceed the amount you paid for that order or transaction, except where a different outcome is required under applicable law.",
      "Nothing in these terms excludes or limits liability that cannot legally be excluded or restricted, including rights or remedies available to consumers under applicable law.",
    ],
  },
  {
    title: "Governing Law and Jurisdiction",
    body: [
      "These terms and your use of the website are governed by the laws of India.",
      "Subject to any mandatory consumer-protection rights or forum requirements that apply to you under law, the courts at Mathura, Uttar Pradesh will have jurisdiction over disputes arising out of or relating to these terms, the website, or orders placed through it.",
    ],
  },
  {
    title: "Policy Updates and Contact",
    body: [
      `For privacy requests, support, wholesale inquiries, or policy questions, contact ${COMPANY_SUPPORT_EMAIL}.`,
      `Press requests can be sent to ${COMPANY_PRESS_EMAIL}.`,
      "We may refine these policies as operations, fulfillment coverage, product lines, or legal requirements change. The latest version published on this page will apply to future use of the site and future orders unless a different version is required by law for an earlier transaction.",
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
            {COMPANY_BRAND_NAME} sells BloodThirst through this website and related channels.
            These policies explain who sells the product, how cancellations and refunds work,
            and the terms that apply when you use the site.
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-bone/25">
            Last updated: April 3, 2026
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
