# Schema / Structured Data Audit -- UNHOLY CO.

**Audit date:** 2026-03-22
**Production domain:** theunholy.co
**Codebase path:** `/Users/aakashsingh/Downloads/unholy-co-website/`

---

## 1. Existing Schema -- Detection & Validation

### 1A. Organization (layout.tsx -- all pages)

**Location:** `src/app/layout.tsx` lines 74-90, injected into `<head>` as JSON-LD.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "UNHOLY CO.",
  "url": "https://theunholy.co",
  "logo": "https://theunholy.co/uhc-logo.png",
  "description": "Gothic premium canned water brand. Natural Himalayan mineral water, zero sugar, zero plastic.",
  "sameAs": ["https://www.instagram.com/unholyco"],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "hello@theunholy.co",
    "availableLanguage": "English"
  }
}
```

| Check | Result |
|---|---|
| @context is `https://schema.org` | PASS |
| @type valid and not deprecated | PASS |
| Required: name, url | PASS |
| logo is absolute URL | PASS |
| sameAs URLs absolute | PASS |
| No placeholder text | PASS |

**Issues found:**

- **[Medium]** `logo` should be an `ImageObject` with `url`, `width`, and `height` properties for Google's preferred format. A bare string URL works but is less robust.
- **[Low]** `sameAs` only contains Instagram. If the brand has X/Twitter (@unholyco per OG meta), LinkedIn, or YouTube, those should be added.
- **[Low]** Missing `foundingDate`, `founder`, and `areaServed` -- recommended for D2C brand knowledge panel eligibility.

---

### 1B. WebSite (layout.tsx -- all pages)

**Location:** `src/app/layout.tsx` lines 92-98.

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "UNHOLY CO.",
  "url": "https://theunholy.co",
  "description": "Gothic premium canned water. Natural Himalayan mineral water. Zero sugar, zero plastic."
}
```

| Check | Result |
|---|---|
| @context is `https://schema.org` | PASS |
| @type valid | PASS |
| Required: name, url | PASS |
| URLs absolute | PASS |

**Issues found:**

- **[Medium]** Missing `potentialAction` with `SearchAction`. If the site has search functionality, this enables Google sitelinks search box. If no search exists, this is not actionable -- skip.
- **[Low]** `publisher` property linking back to the Organization is recommended.

---

### 1C. Product (bloodthirst/page.tsx -- /bloodthirst only)

**Location:** `src/app/bloodthirst/page.tsx` lines 23-40.

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "BloodThirst",
  "brand": { "@type": "Brand", "name": "UNHOLY CO." },
  "description": "Natural Himalayan mineral water at 11,000 feet. Zero sugar, zero plastic. Sealed in obsidian-black aluminum.",
  "image": "https://theunholy.co/can.png",
  "url": "https://theunholy.co/bloodthirst",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock",
    "url": "https://theunholy.co/shop"
  }
}
```

| Check | Result |
|---|---|
| @context is `https://schema.org` | PASS |
| @type valid | PASS |
| Required: name | PASS |
| image absolute URL | PASS |
| offers.availability full URI | PASS |

**Issues found (Critical for rich results):**

- **[Critical]** `AggregateOffer` is missing required `lowPrice` and `highPrice` (or `offerCount`). Google requires these for AggregateOffer. Based on catalog data: lowPrice 169 (per can in 24-pack) or 1200 (pack level), highPrice 200 (per can) or 4056 (pack level). Without these, Google will silently drop the Product rich result.
- **[Critical]** Missing `review` or `aggregateRating`. Google strongly recommends at least one for Product rich result eligibility. Without reviews, the listing may appear without star ratings in SERPs.
- **[Medium]** Missing `sku` and `gtin` / `mpn` identifiers -- recommended by Google for merchant listing eligibility.
- **[Medium]** Missing `category` -- e.g., "Food & Beverages > Beverages > Water".

---

## 2. Pages Without Any Page-Level Schema

The following pages rely solely on the global Organization + WebSite from layout.tsx and have **zero page-specific structured data**:

| Page | Route | Schema Present |
|---|---|---|
| Homepage | `/` | None (global only) |
| Shop | `/shop` | None |
| Story | `/story` | None |
| Drops | `/drops` | None |
| Contact | `/contact` | None |
| Legal | `/legal` | None |
| Bloodverse Hub | `/bloodverse` | None |
| Chapter 1 | `/bloodverse/chapter-1` | None |
| Chapter 2 | `/bloodverse/chapter-2` | None |
| Chapter 3 | `/bloodverse/chapter-3` | None |

---

## 3. Missing Schema Opportunities

Ranked by impact (highest first).

### 3A. [High] BreadcrumbList -- All Pages

**Why:** BreadcrumbList is one of the easiest rich results to earn. Google displays breadcrumb trails in SERPs, improving CTR and helping users understand site hierarchy. No page on the site has this.

**Where to implement:** `src/app/layout.tsx` or per-page. Since breadcrumbs vary by page, a per-page approach or a shared utility is cleaner.

---

### 3B. [High] Product + Offers on Shop Page

**Why:** The /shop page is the conversion page with three distinct pack offers (Starter Ritual 6-pack at INR 1200, Weekend Coven 12-pack at INR 2220, True Believer 24-pack at INR 4056). It currently has zero structured data. This is the highest-value missing schema on the site.

---

### 3C. [High] Fix AggregateOffer on /bloodthirst

**Why:** The existing Product schema will fail Google validation due to missing `lowPrice`/`highPrice`. This is a fix, not a new addition.

---

### 3D. [Medium] CreativeWork / Article on Bloodverse Chapters

**Why:** The three Bloodverse chapters are long-form narrative content. Marking them as `Article` (or `CreativeWork`) with proper `headline`, `author`, `datePublished`, and `publisher` helps Google understand and index this content. It also benefits AI/LLM citation pipelines.

---

### 3E. [Medium] Product Schema on Homepage

**Why:** The homepage is product-focused (hero, showcase, CTA all center on BloodThirst). A lightweight Product reference helps Google associate the homepage with the product entity.

---

### 3F. [Low] ItemList on Shop Page

**Why:** Wrapping the three packs in an ItemList enables potential carousel/list rich results. Lower priority than individual Product/Offer markup but additive.

---

### 3G. [Info] FAQPage

**Why:** As of August 2023, Google restricts FAQ rich results to government and healthcare sites. UNHOLY CO. is a commercial D2C brand, so FAQPage markup will **not** trigger Google rich results. However, FAQ schema still benefits AI/LLM citation and Generative Engine Optimization (GEO). **Not recommended unless GEO is a priority.**

---

### 3H. [Not Recommended] LocalBusiness

**Why:** UNHOLY CO. is a D2C online-only brand. LocalBusiness schema is designed for businesses with a physical location customers visit. Using it without a real storefront address would be inaccurate. **Organization (already present) is the correct type.**

---

### 3I. [Not Recommended] SiteNavigationElement

**Why:** This schema type is not a Google-supported rich result type. It adds no SERP benefit and minimal LLM benefit. Not worth the implementation effort.

---

## 4. Recommended JSON-LD Implementations

### 4A. Fix: Product Schema on /bloodthirst

Replace the existing `productSchema` in `src/app/bloodthirst/page.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "BloodThirst",
  "brand": {
    "@type": "Brand",
    "name": "UNHOLY CO."
  },
  "description": "Natural Himalayan mineral water sourced at 11,000 feet. Zero sugar, zero plastic. Sealed in obsidian-black aluminum.",
  "image": "https://theunholy.co/can.png",
  "url": "https://theunholy.co/bloodthirst",
  "category": "Food & Beverages > Beverages > Water",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "INR",
    "lowPrice": "1200",
    "highPrice": "4056",
    "offerCount": 3,
    "availability": "https://schema.org/InStock",
    "url": "https://theunholy.co/shop"
  }
}
```

---

### 4B. New: BreadcrumbList (per-page examples)

**Homepage (`/`):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://theunholy.co"
    }
  ]
}
```

**BloodThirst (`/bloodthirst`):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://theunholy.co"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "BloodThirst",
      "item": "https://theunholy.co/bloodthirst"
    }
  ]
}
```

**Shop (`/shop`):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://theunholy.co"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Shop",
      "item": "https://theunholy.co/shop"
    }
  ]
}
```

**Bloodverse Chapter (`/bloodverse/chapter-1`):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://theunholy.co"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Bloodverse",
      "item": "https://theunholy.co/bloodverse"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Chapter I: The Reaper Knocks",
      "item": "https://theunholy.co/bloodverse/chapter-1"
    }
  ]
}
```

Follow the same pattern for `/bloodverse/chapter-2` and `/bloodverse/chapter-3`.

---

### 4C. New: Product + ItemList on /shop

Add to `src/app/shop/page.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "BloodThirst Packs",
  "url": "https://theunholy.co/shop",
  "numberOfItems": 3,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Product",
        "name": "BloodThirst Starter Ritual (6 Cans)",
        "description": "6 cans of cold-forged hydration. Perfect first taste.",
        "brand": {
          "@type": "Brand",
          "name": "UNHOLY CO."
        },
        "image": "https://theunholy.co/can.png",
        "url": "https://theunholy.co/shop",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": "1200",
          "availability": "https://schema.org/InStock",
          "url": "https://theunholy.co/shop"
        }
      }
    },
    {
      "@type": "ListItem",
      "position": 2,
      "item": {
        "@type": "Product",
        "name": "BloodThirst Weekend Coven (12 Cans)",
        "description": "12 cans for the weekend warriors and night crawlers.",
        "brand": {
          "@type": "Brand",
          "name": "UNHOLY CO."
        },
        "image": "https://theunholy.co/can.png",
        "url": "https://theunholy.co/shop",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": "2220",
          "availability": "https://schema.org/InStock",
          "url": "https://theunholy.co/shop"
        }
      }
    },
    {
      "@type": "ListItem",
      "position": 3,
      "item": {
        "@type": "Product",
        "name": "BloodThirst True Believer (24 Cans)",
        "description": "24 cans. Full commitment. Maximum savings.",
        "brand": {
          "@type": "Brand",
          "name": "UNHOLY CO."
        },
        "image": "https://theunholy.co/can.png",
        "url": "https://theunholy.co/shop",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": "4056",
          "availability": "https://schema.org/InStock",
          "url": "https://theunholy.co/shop"
        }
      }
    }
  ]
}
```

---

### 4D. New: Article on Bloodverse Chapters

Add to each chapter page. Example for Chapter 1 (`src/app/bloodverse/chapter-1/page.tsx`):

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Chapter I: The Reaper Knocks",
  "description": "3:33 AM. Mumbai. A delivery arrives that you don't remember ordering. You crack open BloodThirst — and the can answers back.",
  "author": {
    "@type": "Organization",
    "name": "UNHOLY CO.",
    "url": "https://theunholy.co"
  },
  "publisher": {
    "@type": "Organization",
    "name": "UNHOLY CO.",
    "url": "https://theunholy.co",
    "logo": {
      "@type": "ImageObject",
      "url": "https://theunholy.co/uhc-logo.png"
    }
  },
  "url": "https://theunholy.co/bloodverse/chapter-1",
  "mainEntityOfPage": "https://theunholy.co/bloodverse/chapter-1",
  "image": "https://theunholy.co/og-hero.png",
  "datePublished": "2025-01-01",
  "dateModified": "2025-01-01",
  "isPartOf": {
    "@type": "CreativeWorkSeries",
    "name": "The Bloodverse",
    "url": "https://theunholy.co/bloodverse"
  }
}
```

Repeat for Chapter 2 and Chapter 3 with their respective titles, descriptions, and URLs. Update `datePublished`/`dateModified` to actual publish dates.

---

### 4E. New: WebPage on Homepage

Add to `src/app/page.tsx` (or create a schema constant and inject as JSON-LD):

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "UNHOLY CO. — BloodThirst",
  "description": "Gothic premium canned water. Natural Himalayan mineral water. Zero sugar, zero plastic. Stay Unholy.",
  "url": "https://theunholy.co",
  "mainEntity": {
    "@type": "Product",
    "name": "BloodThirst",
    "brand": {
      "@type": "Brand",
      "name": "UNHOLY CO."
    },
    "description": "Natural Himalayan mineral water sourced at 11,000 feet. Zero sugar, zero plastic. Sealed in obsidian-black aluminum.",
    "image": "https://theunholy.co/can.png",
    "url": "https://theunholy.co/bloodthirst",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": "1200",
      "highPrice": "4056",
      "offerCount": 3,
      "availability": "https://schema.org/InStock",
      "url": "https://theunholy.co/shop"
    }
  }
}
```

---

### 4F. Enhancement: Organization in layout.tsx

Improved version with fuller properties:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "UNHOLY CO.",
  "url": "https://theunholy.co",
  "logo": {
    "@type": "ImageObject",
    "url": "https://theunholy.co/uhc-logo.png",
    "width": 512,
    "height": 512
  },
  "description": "Gothic premium canned water brand. Natural Himalayan mineral water, zero sugar, zero plastic.",
  "foundingDate": "2025",
  "areaServed": {
    "@type": "Country",
    "name": "India"
  },
  "sameAs": [
    "https://www.instagram.com/unholyco",
    "https://x.com/unholyco"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "hello@theunholy.co",
    "availableLanguage": "English"
  }
}
```

Update `logo.width`/`logo.height` to actual dimensions of `/uhc-logo.png`. Add/remove `sameAs` entries to match real active profiles. Confirm `foundingDate`.

---

## 5. Implementation Priority

| Priority | Item | File to Edit | Impact |
|---|---|---|---|
| 1 (Critical) | Fix AggregateOffer -- add lowPrice/highPrice | `src/app/bloodthirst/page.tsx` | Fixes broken Product rich result |
| 2 (High) | Add Product + ItemList to /shop | `src/app/shop/page.tsx` | Enables Product rich results on conversion page |
| 3 (High) | Add BreadcrumbList to all pages | Each `page.tsx` or shared utility | Breadcrumb rich results across site |
| 4 (Medium) | Add WebPage + Product on homepage | `src/app/page.tsx` | Product entity association |
| 5 (Medium) | Add Article to Bloodverse chapters | `src/app/bloodverse/chapter-*/page.tsx` | Content indexing + AI citation |
| 6 (Low) | Enhance Organization (logo ImageObject, sameAs) | `src/app/layout.tsx` | Knowledge panel eligibility |
| 7 (Low) | Add publisher to WebSite schema | `src/app/layout.tsx` | Minor completeness |

---

## 6. What NOT to Add

| Schema | Reason |
|---|---|
| HowTo | Google removed rich results (Sept 2023) |
| FAQPage | Restricted to govt/health sites for rich results (Aug 2023). Only useful for GEO/AI citation. |
| LocalBusiness | UNHOLY CO. is online-only D2C. Organization is correct. |
| SiteNavigationElement | Not a Google rich result type. No SERP benefit. |
| SpecialAnnouncement | Deprecated July 2025. |

---

## 7. Validation Command

After implementation, validate each page at:
- https://search.google.com/test/rich-results
- https://validator.schema.org/

Test these URLs:
- `https://theunholy.co/`
- `https://theunholy.co/bloodthirst`
- `https://theunholy.co/shop`
- `https://theunholy.co/bloodverse/chapter-1`
