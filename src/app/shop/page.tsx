import type { Metadata } from "next"
import { Anton } from "next/font/google"
import { PACKS, getPackById } from "@/lib/shop/catalog"
import { SIN_AVAILABLE_PACK_IDS, SIN_ENTRY_PACK_ID } from "@/content/sin"
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site/seo"
import { SinClient } from "../sin/SinClient"

/**
 * /shop — the OFFICIAL BloodThirst shop, serving the "RED MASS" experience
 * (see brandbible.md: gothic-luxe + premium streetwear, loud disruptor).
 *
 * Same client as /sin — one commerce experience, two doors: /shop is the
 * indexed, nav-linked storefront; /sin stays noindex for ad campaigns already
 * pointing at it. Both share the checkout spine (useRitualCheckout), the
 * private cart/add-on storage keys, and the "sin"-source pack allowlist so
 * paid + organic traffic can only buy shipping-ready packs.
 *
 * The old luxury ShopClient (+ ShopClosedClient launch gate — launch was
 * 2026-04-02, long past) is superseded and no longer rendered.
 */
export const revalidate = 60

/** RED MASS poster face — loaded route-locally so only this page pays for it. */
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
})

const shopUrl = `${SITE_URL}/shop`

const TITLE = "Shop BloodThirst — Drink Like You Mean It"
const DESCRIPTION =
  "500ml Himalayan still mineral water in a matte-black can. Batch 001, first pressing — 6, 12 and 24-can drops. FSSAI licensed, Razorpay secure, free delivery across India."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/shop" },
  openGraph: {
    title: `${TITLE} | UNHOLY CO.`,
    description: DESCRIPTION,
    url: "/shop",
    images: [{ url: "/og-sin.png", width: 1200, height: 630, alt: "BloodThirst — Drink Like You Mean It. Batch 001." }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | UNHOLY CO.`,
    description: DESCRIPTION,
    images: ["/og-sin.png"],
  },
}

// Product schema constrained to the packs actually purchasable on the page
// (single/trial stay hidden until their packaging ships — the offer list must
// never promise what fulfilment can't deliver). No ratings/reviews: brand
// guardrail — nothing fake, and real ones aren't collected yet.
const availablePacks = PACKS.filter((pack) =>
  SIN_AVAILABLE_PACK_IDS.includes(pack.id as (typeof SIN_AVAILABLE_PACK_IDS)[number])
)

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
    itemListElement: availablePacks.map((pack, index) => ({
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

export default function ShopPage() {
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""

  // Default selection derives from the same content id the hero price uses,
  // so the two can never disagree.
  const defaultPackId = (getPackById(SIN_ENTRY_PACK_ID) || PACKS[0]).id

  return (
    <div className={anton.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopSchema) }}
      />
      <SinClient razorpayKey={razorpayKey} defaultPackId={defaultPackId} />
    </div>
  )
}
