"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TransitionLink } from "@/components/ux/TransitionLink"
import { COMPANY_FSSAI_LICENSE, COMPANY_LEGAL_NAME, COMPANY_SUPPORT_EMAIL } from "@/lib/site/company"

type FAQItem = {
  question: string
  answer: string
}

type FAQSection = {
  title: string
  tag: string
  items: FAQItem[]
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: "The Product",
    tag: "BLOODTHIRST",
    items: [
      {
        question: "What is BloodThirst?",
        answer:
          "BloodThirst is UNHOLY CO.'s flagship water: natural Himalayan mineral water packed in a matte-black aluminium can for a colder, cleaner, plastic-free serve.",
      },
      {
        question: "Where does the water come from?",
        answer:
          "Sourced from natural Himalayan mineral springs. Naturally filtered through ancient rock formations, rich in essential minerals.",
      },
      {
        question: "Is BloodThirst an energy drink?",
        answer:
          "No. There is no caffeine, sugar, or stimulant blend here. The name is theatrical; the liquid is still straight mineral water.",
      },
      {
        question: "What's the shelf life?",
        answer:
          "12 months from the date of manufacture. Best consumed chilled. Store in a cool, dry place away from direct sunlight.",
      },
      {
        question: "Is the can recyclable?",
        answer:
          "Yes. Aluminium is infinitely recyclable. Every BloodThirst can is 100% recyclable — zero plastic, zero waste. Crush it, recycle it, feel nothing.",
      },
      {
        question: "What are the nutritional contents?",
        answer:
          "Nothing extra has been added. The latest water test shows pH 7.18, TDS 256.87 mg/L, and calcium 28.05 mg/L, with zero sugar, zero calories, and no artificial flavouring.",
      },
      {
        question: "Is BloodThirst FSSAI licensed?",
        answer:
          `Yes. BloodThirst is sold under FSSAI Lic. No. ${COMPANY_FSSAI_LICENSE}. The product is marketed by Unholy Beverages Private Limited.`,
      },
    ],
  },
  {
    title: "Orders & Shipping",
    tag: "LOGISTICS",
    items: [
      {
        question: "How long does shipping take?",
        answer:
          "Most orders leave our side within 24–48 hours. After that, transit usually takes another 3–7 business days depending on where in India you're located.",
      },
      {
        question: "Is shipping free?",
        answer:
          "Yes. Free shipping on all orders across India. No minimum order, no hidden charges.",
      },
      {
        question: "Do you ship outside India?",
        answer:
          "Currently, we only ship within India. International shipping is on the roadmap — follow our drops page for updates.",
      },
      {
        question: "How do I track my order?",
        answer:
          "Once your package is booked, we send a tracking link by email. If that email is buried, you can also check status anytime at `theunholy.co/track` with your order ID or checkout email.",
      },
      {
        question: "Can I change my shipping address after placing an order?",
        answer:
          "Sometimes, yes. If the order has not moved into dispatch yet, contact us immediately and we'll try to update it. Once the courier is assigned, the address is effectively locked.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          `Yes, but speed matters. Email ${COMPANY_SUPPORT_EMAIL} with your order ID as soon as possible. We can review cancellations before dispatch; once the shipment is packed or handed to the courier, cancellation is usually no longer available except where required by law.`,
      },
    ],
  },
  {
    title: "Payments & Pricing",
    tag: "PAYMENTS",
    items: [
      {
        question: "What payment methods do you accept?",
        answer:
          "UPI, credit/debit cards, net banking, and digital wallets — all through Razorpay. We are prepaid-only right now, so COD is not currently available.",
      },
      {
        question: "Are prices inclusive of taxes?",
        answer:
          "Yes. All prices displayed are inclusive of 5% GST. What you see is what you pay — no surprises at checkout.",
      },
      {
        question: "Is my payment information secure?",
        answer:
          "Yes. Checkout is handled through Razorpay, and we do not store your full payment details on our own servers.",
      },
      {
        question: "What if my payment fails?",
        answer:
          "If the transaction drops before confirmation, the order will not be completed. In cases where money was debited without a confirmed order, banks usually reverse it within 5–7 business days. If that doesn't happen, contact us and we'll investigate.",
      },
    ],
  },
  {
    title: "Returns & Refunds",
    tag: "RETURNS",
    items: [
      {
        question: "What is your return policy?",
        answer:
          "Because this is a consumable product, we do not accept routine returns after delivery. The exception is when something is wrong with the order itself, such as transit damage, a defect, or the wrong item being sent.",
      },
      {
        question: "How do I request a refund?",
        answer:
          `Send us your order ID, a short description of the issue, and clear photos through the contact page or by emailing ${COMPANY_SUPPORT_EMAIL}. We review claims within 24–48 hours.`,
      },
      {
        question: "How long do refunds take?",
        answer:
          "After approval, the refund is sent back to the original payment method. Most banks and payment partners reflect it within 5–7 business days.",
      },
    ],
  },
  {
    title: "The Brand",
    tag: "UNHOLY CO.",
    items: [
      {
        question: "What is UNHOLY CO.?",
        answer:
          "We're a premium beverage brand that believes hydration doesn't have to be boring. Born from the frustration of plastic waste and bland packaging, we created BloodThirst — water with a dark soul.",
      },
      {
        question: "Who is the legal seller behind UNHOLY CO.?",
        answer:
          `${COMPANY_LEGAL_NAME} is the seller of record for every order placed on this website, and that name appears on invoices and legal documents.`,
      },
      {
        question: "How can I collaborate or partner with UNHOLY CO.?",
        answer:
          "We review collaborations across venues, events, artists, and aligned brands. Use the contact page, choose 'Partnership,' and tell us what you're planning.",
      },
      {
        question: "What is Bloodverse?",
        answer:
          "Bloodverse is our immersive narrative universe — a multi-chapter story experience embedded in our packaging via QR codes. Scan, enter, explore. Each chapter reveals a new piece of the UNHOLY origin story.",
      },
      {
        question: "Do you have a loyalty or rewards program?",
        answer:
          "Not yet — but it's coming. Follow our drops page and subscribe to the newsletter to be the first to know when it launches.",
      },
    ],
  },
]

export function FAQClient() {
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  const toggle = (id: string) => {
    setOpenIndex((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen px-4 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-20"
        >
          <p className="mb-6 text-[10px] uppercase tracking-[0.5em] text-blood/60">
            Knowledge Base
          </p>
          <h1 className="font-cinzel text-4xl font-bold text-offwhite md:text-5xl lg:text-6xl">
            Frequently Asked
            <br />
            <span className="text-blood">Questions</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-bone/50">
            Everything you need to know about BloodThirst, orders, and the UNHOLY
            ecosystem. Can&apos;t find your answer?{" "}
            <TransitionLink
              href="/contact"
              className="text-blood/70 underline underline-offset-2 transition-colors hover:text-blood"
            >
              Contact us
            </TransitionLink>
            .
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-12">
          {FAQ_SECTIONS.map((section, sIdx) => (
            <motion.div
              key={section.tag}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: sIdx * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Section header */}
              <div className="mb-5 flex items-center gap-4">
                <span className="inline-block rounded-full border border-blood/30 bg-blood/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blood">
                  {section.tag}
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Questions */}
              <div className="space-y-0">
                {section.items.map((item, qIdx) => {
                  const id = `${sIdx}-${qIdx}`
                  const isOpen = openIndex === id

                  return (
                    <div
                      key={id}
                      className="border-b border-white/[0.06] last:border-b-0"
                    >
                      <button
                        onClick={() => toggle(id)}
                        className="group flex w-full items-center justify-between py-5 text-left transition-colors"
                      >
                        <span
                          className={`pr-8 text-sm font-medium transition-colors duration-200 md:text-base ${
                            isOpen
                              ? "text-offwhite"
                              : "text-bone/60 group-hover:text-offwhite"
                          }`}
                        >
                          {item.question}
                        </span>
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                            isOpen
                              ? "border-blood/40 bg-blood/15 text-blood rotate-45"
                              : "border-white/[0.1] text-bone/30 group-hover:border-white/20 group-hover:text-bone/50"
                          }`}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                              opacity: { duration: 0.25 },
                            }}
                            className="overflow-hidden"
                          >
                            <p className="pb-5 pr-12 text-sm leading-relaxed text-bone/45">
                              {item.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 rounded-2xl border border-white/[0.07] bg-black/40 p-8 text-center md:p-12"
          style={{
            boxShadow:
              "0 0 60px rgba(176,0,32,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-blood/50">
            Still have questions?
          </p>
          <h2 className="font-cinzel text-2xl font-bold text-offwhite md:text-3xl">
            We&apos;re here to help.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-bone/40">
            Reach out via the contact page and we&apos;ll respond within 24 hours.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <TransitionLink href="/contact" className="btn btn-primary px-6 py-3 text-sm">
              Contact Us
            </TransitionLink>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
