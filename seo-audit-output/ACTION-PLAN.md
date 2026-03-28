# UNHOLY CO. -- SEO Action Plan

**Generated:** 2026-03-22
**Current Score:** 42/100
**Target Score:** 75/100 (achievable with Critical + High fixes)

---

## Critical -- Fix Immediately (blocks indexing or causes penalties)

### 1. Remove middleware teaser rewrite OR add noindex
**File:** `src/middleware.ts` (lines 23-49)
**Impact:** All 11 sitemap URLs serve wrong content to Google
**Fix:** Either remove the teaser rewrite (if launching the full site) or:
- Add `<meta name="robots" content="noindex">` to teaser page
- Remove `Sitemap:` line from robots.txt until full launch
**Est. time:** 5 min

### 2. Restore or replace og-hero.png
**Files:** `public/og-hero.png` (deleted), referenced in `src/app/layout.tsx:57`, `src/app/bloodthirst/page.tsx:13`
**Impact:** Next deploy breaks social sharing previews on every page
**Fix:** Restore the file to public/ or update all metadata to reference a new image
**Est. time:** 5 min

### 3. Fix legal page metadata
**File:** `src/app/legal/page.tsx` (lines 4-8)
**Impact:** Wrong canonical, wrong OG tags, double-branded title
**Fix:**
```typescript
export const metadata: Metadata = {
  title: 'Legal',  // template will add "| UNHOLY CO."
  description: 'Privacy, shipping, returns, and website terms for UNHOLY CO. and BloodThirst.',
  alternates: { canonical: '/legal' },
  openGraph: {
    title: 'Legal — UNHOLY CO.',
    description: 'Privacy, shipping, returns, and website terms for UNHOLY CO. and BloodThirst.',
    url: 'https://theunholy.co/legal',
  },
}
```
**Est. time:** 10 min

### 4. Fix Product schema -- add prices
**File:** `src/app/bloodthirst/page.tsx` (lines 35-39)
**Impact:** AggregateOffer without lowPrice/highPrice = Google silently drops Product rich result
**Fix:** Add `"lowPrice": "1200"`, `"highPrice": "4056"`, `"offerCount": 3` to the offers block
**Est. time:** 5 min

### 5. Add physical address + FSSAI license to site
**Files:** Footer component, `src/app/contact/`, `src/app/legal/page.tsx`
**Impact:** Legal requirement for Indian e-commerce + highest-impact trust signal missing
**Fix:** Add registered business address, FSSAI license number, and GSTIN to footer and legal page
**Est. time:** 30 min (needs actual business info)

---

## High -- Fix This Week (significantly impacts rankings)

### 6. Block utility pages in robots.txt
**File:** `public/robots.txt`
**Fix:** Add:
```
Disallow: /teaser
Disallow: /qr
Disallow: /thanks
```
**Est. time:** 2 min

### 7. Fix teaser page double-branded title
**File:** `src/app/teaser/page.tsx` (line 5)
**Fix:** Change `title: "Something Unholy Is Coming -- UNHOLY CO."` to `title: "Something Unholy Is Coming"`
**Est. time:** 1 min

### 8. Add BreadcrumbList schema to all pages
**Files:** Each `page.tsx` or create shared utility
**Impact:** Breadcrumb rich results across all SERPs
**Fix:** See JSON-LD examples in `seo-audit-output/schema.md` section 4B
**Est. time:** 1 hour

### 9. Add Product + ItemList schema to /shop
**File:** `src/app/shop/page.tsx`
**Impact:** Product rich results on the conversion page
**Fix:** See JSON-LD in `seo-audit-output/schema.md` section 4C
**Est. time:** 30 min

### 10. Reduce preloader duration
**File:** `src/components/ux/Preloader.tsx` (line 8)
**Impact:** -1.2s off LCP on first visits
**Fix:** Change `DISPLAY_DURATION = 1800` to `DISPLAY_DURATION = 600`
**Est. time:** 1 min

### 11. Defer PostHog/Sentry initialization
**File:** `src/components/providers/PostHogProvider.tsx` (line 28)
**Impact:** Frees ~85 KB from competing with hydration
**Fix:** Wrap init in `requestIdleCallback` with 5s timeout fallback
**Est. time:** 15 min

### 12. Expand /shop page content to 400+ words
**File:** `src/app/shop/ShopClient.tsx` (or `ShopClientV2.tsx`)
**Impact:** Currently 190 words -- critically thin for a commerce page
**Fix:** Add product descriptions, shipping info, payment methods, return policy summary
**Est. time:** 1-2 hours

---

## Medium -- Fix This Month (optimization opportunities)

### 13. Add FAQ sections to /bloodthirst and /shop
**Impact:** AI citation readiness + user engagement
**Fix:** Add 5-8 FAQs per page covering common questions (mineral content, BPA-free, shipping, etc.)
**Est. time:** 2 hours

### 14. Add Article schema to Bloodverse chapters
**Files:** `src/app/bloodverse/chapter-*/page.tsx`
**Fix:** See JSON-LD in `seo-audit-output/schema.md` section 4D
**Est. time:** 30 min

### 15. Pre-optimize images (replace unoptimized: true)
**File:** `next.config.mjs`, image files in `public/`
**Fix:** Convert can.png to WebP with responsive sizes, use `<picture>` with srcset
**Est. time:** 2 hours

### 16. Add factual product definition paragraph
**Files:** Homepage + /bloodthirst
**Impact:** AI citation readiness (currently 35/100)
**Fix:** Add "BloodThirst is a [TDS] natural Himalayan mineral water packaged in 500ml recycled aluminum cans, sourced at 11,000 feet."
**Est. time:** 30 min

### 17. Replace GSAP with Framer Motion for transitions
**File:** `src/context/TransitionContext.tsx`
**Impact:** Removes ~28 KB GSAP from every page
**Fix:** Rewrite curtain effect using Framer Motion `useAnimate`
**Est. time:** 3-4 hours

### 18. Optimize SVG noise grain filter
**File:** `src/components/ux/NoiseGrain.tsx`
**Fix:** Reduce feTurbulence octaves from 4 to 2, or use pre-rendered noise texture
**Est. time:** 15 min

### 19. Add founder names and photos to /story
**File:** `src/app/story/` components
**Impact:** E-E-A-T experience + trust signals
**Est. time:** 1 hour (needs real content)

### 20. Expand homepage to 500+ words
**Fix:** Add introductory paragraph explaining what BloodThirst is, product category context, trust signals
**Est. time:** 1 hour

### 21. Add cookie/analytics disclosure to legal page
**File:** `src/app/legal/` components
**Impact:** DPDP Act 2023 compliance (PostHog + Sentry session replay not disclosed)
**Est. time:** 30 min

### 22. Remove `will-change` from HeartbeatGlow
**File:** `src/app/globals.css` (lines 584, 601)
**Fix:** Remove `will-change: opacity, transform` from two full-viewport overlay divs
**Est. time:** 2 min

---

## Low -- Backlog (nice to have)

### 23. Enhance Organization schema (ImageObject logo, foundingDate, more sameAs)
### 24. Add IndexNow integration for faster re-indexing
### 25. Add `content-visibility: auto` to below-fold homepage sections
### 26. Lazy-load Lenis smooth scroll
### 27. Reduce Cinzel font weights (4 → 2-3)
### 28. Add `poweredByHeader: false` to next.config.mjs
### 29. Audit and remove vanta/lottie-react if unused
### 30. Set proper edge cache headers for ISR pages

---

## Expected Score After Fixes

| Phase | Actions | Est. Score |
|-------|---------|------------|
| Current | -- | 42/100 |
| After Critical (#1-5) | Middleware, OG, legal, schema, trust signals | 55/100 |
| After High (#6-12) | robots.txt, breadcrumbs, shop schema, perf | 68/100 |
| After Medium (#13-22) | FAQ, images, content expansion, GSAP removal | 78/100 |
| After Low (#23-30) | Polish | 82/100 |

---

## Files Most Frequently Referenced

| File | Issues |
|------|--------|
| `src/middleware.ts` | C1: teaser rewrite |
| `src/app/layout.tsx` | C2: OG image, schema enhancements |
| `src/app/legal/page.tsx` | C3/C4/C5: canonical, OG, title |
| `src/app/bloodthirst/page.tsx` | C4: Product schema prices |
| `public/robots.txt` | H6: block utility pages |
| `src/components/ux/Preloader.tsx` | H10: reduce duration |
| `src/components/providers/PostHogProvider.tsx` | H11: defer analytics |
| `src/app/shop/page.tsx` | H9/H12: schema + content |
| `next.config.mjs` | M15: image optimization |
