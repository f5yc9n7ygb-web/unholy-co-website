import type { Metadata } from "next"
import { BloodThirstClient } from "./BloodThirstClient"

export const metadata: Metadata = {
  title: "BloodThirst",
  description:
    "Natural Himalayan mineral water at 11,000 feet. Zero sugar, zero plastic. Sealed in obsidian-black aluminum for night rituals, backstage riders, and everyone done settling for basic.",
  alternates: { canonical: '/bloodthirst' },
  openGraph: {
    title: "BloodThirst — UNHOLY CO.",
    description: "Natural Himalayan mineral water at 11,000 feet. Zero sugar, zero plastic. Sealed in obsidian-black aluminum for night rituals, backstage riders, and everyone done settling for basic.",
    url: '/bloodthirst',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'BloodThirst — UNHOLY CO. Premium Canned Water' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "BloodThirst — UNHOLY CO.",
    description: "Natural Himalayan mineral water at 11,000 feet. Zero sugar, zero plastic.",
    images: ['/og-hero.png'],
  },
}

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'BloodThirst',
  brand: {
    '@type': 'Brand',
    name: 'UNHOLY CO.',
  },
  description: 'Natural Himalayan mineral water at 11,000 feet. Zero sugar, zero plastic. Sealed in obsidian-black aluminum.',
  image: 'https://theunholy.co/can.png',
  url: 'https://theunholy.co/bloodthirst',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    url: 'https://theunholy.co/shop',
  },
}

export default function BloodThirstPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <BloodThirstClient />
    </>
  )
}
