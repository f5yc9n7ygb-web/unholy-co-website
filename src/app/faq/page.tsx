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
        text: "BloodThirst is UNHOLY CO.'s flagship water: natural Himalayan mineral water packed in a matte-black aluminium can for a colder, cleaner, plastic-free serve.",
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
        text: "Most orders leave within 24-48 hours. After dispatch, delivery usually takes another 3-7 business days depending on the destination within India.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel my order?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Orders can be reviewed for cancellation before dispatch. Once packed or handed to the courier, cancellation is usually no longer available except where required by law.",
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
        text: "Because BloodThirst is a consumable product, routine returns are not accepted after delivery. If the order arrives damaged, defective, or incorrect, contact us within 48 hours for review.",
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
