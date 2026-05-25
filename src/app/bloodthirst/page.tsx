import type { Metadata } from "next"
import { PACKS } from "@/lib/shop/catalog"
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site/seo"
import { BloodThirstClient } from "./BloodThirstClient"

const productUrl = `${SITE_URL}/bloodthirst`
const shopUrl = `${SITE_URL}/shop`
const packPrices = PACKS.map((pack) => pack.price)

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
  '@id': `${productUrl}#product`,
  name: 'BloodThirst Himalayan Mineral Water',
  alternateName: 'BloodThirst',
  brand: {
    '@type': 'Brand',
    '@id': `${SITE_URL}/#brand`,
    name: SITE_NAME,
  },
  manufacturer: {
    '@id': `${SITE_URL}/#organization`,
  },
  description: 'Natural Himalayan mineral water at 11,000 feet. Zero sugar, zero plastic. Sealed in obsidian-black aluminum.',
  image: [`${SITE_URL}/can.webp`, OG_IMAGE.url],
  url: productUrl,
  sku: 'bloodthirst-500ml',
  category: 'Beverages > Bottled Water',
  material: 'Aluminum can',
  additionalProperty: [
    {
      '@type': 'PropertyValue',
      name: 'Volume',
      value: '500 ml',
    },
    {
      '@type': 'PropertyValue',
      name: 'Sugar',
      value: '0 g',
    },
    {
      '@type': 'PropertyValue',
      name: 'Packaging',
      value: 'Plastic-free aluminum can',
    },
  ],
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'INR',
    lowPrice: Math.min(...packPrices),
    highPrice: Math.max(...packPrices),
    offerCount: PACKS.length,
    availability: 'https://schema.org/InStock',
    url: shopUrl,
    seller: {
      '@id': `${SITE_URL}/#organization`,
    },
    offers: PACKS.map((pack) => ({
      '@type': 'Offer',
      name: `${pack.title} - ${pack.qty} cans`,
      sku: `bloodthirst-${pack.qty}-pack`,
      price: pack.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: shopUrl,
      seller: {
        '@id': `${SITE_URL}/#organization`,
      },
    })),
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
