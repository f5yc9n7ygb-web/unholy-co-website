import type { Metadata } from "next"
import { PACKS } from "@/lib/shop/catalog"
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site/seo"
import { ShopClient } from "./ShopClient"
import { ShopClosedClient } from "./ShopClosedClient"

// Revalidate every 30s so the launch date check flips quickly without
// cold-starting a new edge isolate on every single visitor request.
export const revalidate = 30

const LAUNCH_DATE = new Date('2026-04-02T07:30:00.000Z') // April 2 1:00 PM IST
const shopUrl = `${SITE_URL}/shop`

export const metadata: Metadata = {
  title: "Shop BloodThirst",
  description: "Order BloodThirst cans directly from the coven. Choose your ritual pack and get cold-forged hydration delivered.",
  alternates: { canonical: '/shop' },
  openGraph: {
    title: "Shop BloodThirst — UNHOLY CO.",
    description: "Order BloodThirst cans directly from the coven. Choose your ritual pack and get cold-forged hydration delivered.",
    url: '/shop',
    images: [{ url: '/og-hero.png', width: 1200, height: 630, alt: 'Shop BloodThirst — UNHOLY CO.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Shop BloodThirst — UNHOLY CO.",
    description: "Order BloodThirst cans directly from the coven. Choose your ritual pack and get cold-forged hydration delivered.",
    images: ['/og-hero.png'],
  },
}

const shopSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${shopUrl}#webpage`,
  name: "Shop BloodThirst",
  url: shopUrl,
  isPartOf: {
    "@id": `${SITE_URL}/#website`,
  },
  about: {
    "@id": `${SITE_URL}/bloodthirst#product`,
  },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: PACKS.map((pack, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: `BloodThirst ${pack.qty} Pack`,
        description: pack.blurb,
        image: [`${SITE_URL}/can.webp`, OG_IMAGE.url],
        brand: {
          "@type": "Brand",
          "@id": `${SITE_URL}/#brand`,
          name: SITE_NAME,
        },
        offers: {
          "@type": "Offer",
          price: pack.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: shopUrl,
          seller: {
            "@id": `${SITE_URL}/#organization`,
          },
        },
      },
    })),
  },
}

/**
 * The server-side component for the shop page.
 * Reads the Razorpay key at request time (from runtime secrets) and passes
 * it as a prop to the client — avoids dependency on NEXT_PUBLIC build-time baking.
 * Shows a countdown page until launch on April 2nd 1:00 PM IST.
 */
export default function ShopPage() {
  if (new Date() < LAUNCH_DATE) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(shopSchema) }}
        />
        <ShopClosedClient />
      </>
    )
  }

  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopSchema) }}
      />
      <ShopClient razorpayKey={razorpayKey} />
    </>
  )
}
