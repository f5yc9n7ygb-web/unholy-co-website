import {
  COMPANY_BRAND_NAME,
  COMPANY_GSTIN,
  COMPANY_LEGAL_NAME,
  COMPANY_REGISTERED_ADDRESS_LINES,
  COMPANY_REGISTERED_COUNTRY,
  COMPANY_SUPPORT_EMAIL,
} from "@/lib/site/company"

export const SITE_URL = "https://theunholy.co"
export const SITE_NAME = COMPANY_BRAND_NAME

export const DEFAULT_SEO_TITLE =
  "UNHOLY CO. | BloodThirst Premium Canned Water India"

export const DEFAULT_SEO_DESCRIPTION =
  "BloodThirst by UNHOLY CO. is gothic premium canned Himalayan mineral water in India. Zero sugar, zero plastic, brutally refreshing."

export const DEFAULT_SEO_KEYWORDS = [
  "premium canned water India",
  "BloodThirst",
  "Himalayan mineral water",
  "gothic water brand",
  "UNHOLY CO",
  "aluminium canned water",
  "zero sugar water",
]

export const OG_IMAGE = {
  path: "/og-hero.png",
  url: `${SITE_URL}/og-hero.png`,
  width: 1200,
  height: 630,
  alt: "UNHOLY CO. BloodThirst premium canned Himalayan mineral water",
}

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: COMPANY_BRAND_NAME,
  legalName: COMPANY_LEGAL_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/uhc-logo.png`,
  image: OG_IMAGE.url,
  description:
    "Gothic premium canned water brand selling BloodThirst, natural Himalayan mineral water in aluminium cans.",
  email: COMPANY_SUPPORT_EMAIL,
  taxID: COMPANY_GSTIN,
  sameAs: ["https://www.instagram.com/unholyco"],
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY_REGISTERED_ADDRESS_LINES[0],
    addressLocality: "Mathura",
    addressRegion: "Uttar Pradesh",
    postalCode: "281004",
    addressCountry: COMPANY_REGISTERED_COUNTRY,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: COMPANY_SUPPORT_EMAIL,
    areaServed: "IN",
    availableLanguage: ["English", "Hindi"],
  },
}

export const brandSchema = {
  "@context": "https://schema.org",
  "@type": "Brand",
  "@id": `${SITE_URL}/#brand`,
  name: COMPANY_BRAND_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/uhc-logo.png`,
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: COMPANY_BRAND_NAME,
  alternateName: "UNHOLY CO",
  url: SITE_URL,
  inLanguage: "en-IN",
  description: DEFAULT_SEO_DESCRIPTION,
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
}
