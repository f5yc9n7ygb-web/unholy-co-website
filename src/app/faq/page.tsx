import type { Metadata } from "next"
import { FAQClient } from "./FAQClient"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about BloodThirst, shipping, ingredients, and everything UNHOLY.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — UNHOLY CO.",
    description:
      "Frequently asked questions about BloodThirst, shipping, ingredients, and everything UNHOLY.",
    url: "/faq",
    images: [
      { url: "/og-hero.png", width: 1200, height: 630, alt: "FAQ — UNHOLY CO." },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — UNHOLY CO.",
    description:
      "Frequently asked questions about BloodThirst, shipping, ingredients, and everything UNHOLY.",
    images: ["/og-hero.png"],
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is BloodThirst?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "BloodThirst is premium natural Himalayan mineral water in a matte-black aluminium can. Zero sugar, zero calories, zero plastic. Just pure, cold-forged hydration.",
      },
    },
    {
      "@type": "Question",
      name: "Where does the water come from?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sourced from natural Himalayan mineral springs. Naturally filtered through ancient rock formations, rich in essential minerals.",
      },
    },
    {
      "@type": "Question",
      name: "Is BloodThirst an energy drink?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. BloodThirst is premium mineral water — zero sugar, zero caffeine, zero additives. The name is attitude, not ingredients.",
      },
    },
    {
      "@type": "Question",
      name: "How long does shipping take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Orders are dispatched within 24-48 hours. Delivery typically takes 3-7 business days depending on your location within India.",
      },
    },
    {
      "@type": "Question",
      name: "Do you ship outside India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Currently, we only ship within India. International shipping is coming soon.",
      },
    },
    {
      "@type": "Question",
      name: "What is your return policy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Since BloodThirst is a consumable product, opened or delivered units are not eligible for return. If your order arrives damaged, defective, or incorrect, contact us within 48 hours for a replacement or refund.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods do you accept?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We accept UPI, credit/debit cards, net banking, and digital wallets through Razorpay — India's most trusted payment gateway.",
      },
    },
  ],
}

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQClient />
    </>
  )
}
