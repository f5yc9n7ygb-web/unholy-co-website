# UNHOLY CO. -- Full SEO Audit Report

**Site:** https://theunholy.co (staging: unholy-co-website.pages.dev)
**Date:** 2026-03-22
**Pages crawled:** 11 (full sitemap)
**Business type:** D2C premium beverage brand (gothic/luxury canned water), India market

---

## Executive Summary

### Overall SEO Health Score: 42/100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Technical SEO | 38/100 | 25% | 9.5 |
| Content Quality | 58/100 | 25% | 14.5 |
| On-Page SEO | 52/100 | 20% | 10.4 |
| Schema / Structured Data | 35/100 | 10% | 3.5 |
| Performance (CWV) | 40/100 | 10% | 4.0 |
| Images | 45/100 | 5% | 2.25 |
| AI Search Readiness | 35/100 | 5% | 1.75 |
| **Total** | | | **45.9 → 42** |

### Top 5 Critical Issues

1. **Middleware rewrites all theunholy.co traffic to teaser page** -- all 11 sitemap URLs serve wrong content to Google
2. **OG image (og-hero.png) deleted from git** -- next deploy breaks social sharing on every page
3. **Legal page canonical/OG tags point to homepage** -- duplicate content signal to Google
4. **Product schema missing price data** -- AggregateOffer without lowPrice/highPrice = no rich results
5. **No FSSAI license, physical address, or GSTIN on site** -- legal requirement for Indian e-commerce + trust signal gap

### Top 5 Quick Wins

1. Fix legal page metadata (canonical, OG tags, title) -- 10 min
2. Add lowPrice/highPrice to Product schema on /bloodthirst -- 5 min
3. Restore or replace og-hero.png -- 5 min
4. Block /teaser, /qr, /thanks in robots.txt -- 2 min
5. Reduce preloader duration from 1800ms to 600ms -- 1 min

---

## 1. Technical SEO (38/100)

### Critical Issues

**C1: Middleware Teaser Rewrite**
`src/middleware.ts` (lines 23-49) rewrites every request on theunholy.co to `/teaser`. The sitemap declares 11 URLs on theunholy.co. Google crawls those URLs and receives identical teaser content for all of them = 11 duplicate thin pages.

**Fix:** Remove the teaser rewrite when ready to launch, or add `noindex` to teaser and remove sitemap from robots.txt until then.

**C2: OG Image Deleted**
`public/og-hero.png` and `public/og.png` are deleted from git (still live on current deploy). Every page references `/og-hero.png` in metadata. Next deploy = 404 for all social preview images.

**Fix:** Restore og-hero.png or update all metadata to reference a new image.

**C3: Legal Page Canonical → Homepage**
No `alternates.canonical` override in `src/app/legal/page.tsx`. Falls back to root layout's `canonical: '/'`. Google treats /legal as duplicate of homepage.

**C4: Legal Page OG Tags → Homepage**
Same fallthrough. OG title shows "UNHOLY CO. -- BloodThirst" instead of legal page title. OG URL points to root.

**C5: Double Brand Name in Titles**
Legal page: `"Legal -- UNHOLY CO. | UNHOLY CO."` (page sets "Legal -- UNHOLY CO." + template appends "| UNHOLY CO."). Same issue on teaser page.

### Passing

- Security headers: Excellent (HSTS preload, CSP, X-Frame-Options DENY, nosniff, strict referrer)
- HTTPS with 301 redirect, no chains
- Clean URL structure, logical hierarchy
- Mobile viewport properly configured
- robots.txt blocks /api/, /v2, /v3, /shop-v2 + AI training crawlers
- Sitemap: 11 URLs, valid XML, proper priority

### Medium Issues

- /teaser, /qr, /thanks not blocked in robots.txt (wasted crawl budget)
- `images.unoptimized: true` -- no WebP/AVIF, no srcset
- `X-Powered-By: Next.js` header leaks framework info
- No IndexNow integration
- Pages.dev domain not canonicalized away from production

---

## 2. Content Quality (58/100)

### E-E-A-T Composite: 55/100

| Dimension | Score | Key Issue |
|-----------|-------|-----------|
| Experience (14/20) | Good | Anonymous testimonials, no UGC, no real photos |
| Expertise (15/25) | Moderate | No mineral concentration data, no FSSAI, "volcanic" geology claim questionable |
| Authoritativeness (10/25) | Weak | Single sameAs (Instagram), no press coverage, no external validation |
| Trustworthiness (16/30) | Weak | **No physical address, no FSSAI, no GSTIN** -- legal requirements for Indian e-commerce |

### Thin Content Pages

| Page | Words | Minimum | Status |
|------|-------|---------|--------|
| /shop | ~190 | 300+ | CRITICALLY THIN |
| /bloodverse | ~225 | 500+ | BELOW MINIMUM |
| / (homepage) | ~400 | 500+ | BELOW MINIMUM |
| /contact | ~175 | 200+ | SLIGHTLY THIN |
| /bloodthirst | ~650 | 800+ | BELOW TARGET |

### Content Strengths

- Brand voice is distinctive, authentic, and well-crafted
- Story page has genuine founder narrative with timeline
- Copy is not AI-generated and has original turns of phrase
- No duplicate content issues between pages
- Readability is strong (Grade 8-10 Flesch-Kincaid)

### Keyword Optimization: 40/100

The site is optimized almost exclusively for brand terms ("BloodThirst," "UNHOLY CO."). Zero optimization for category/discovery queries like "canned water India," "premium mineral water," or "aluminum water bottles." For a new brand with no existing search demand, this makes the site nearly invisible for discovery queries.

---

## 3. On-Page SEO (52/100)

### Page-by-Page Summary

| Page | Title | H1 | Meta Desc | Canonical | Issues |
|------|-------|-----|-----------|-----------|--------|
| `/` | UNHOLY CO. -- BloodThirst | BLOODTHIRST | 92 chars (short) | Correct | H1 is brand name only, no category context |
| `/bloodthirst` | BloodThirst \| UNHOLY CO. | BloodThirst | 155 chars | Correct | Best-optimized page |
| `/shop` | Shop BloodThirst \| UNHOLY CO. | Choose Your Ritual | Good | Correct | Thin content, no Product schema |
| `/story` | Our Story \| UNHOLY CO. | From oath to cult classic | Good | Correct | No author attribution |
| `/drops` | Drops \| UNHOLY CO. | Every drop is a ritual | Good | Correct | Acceptable |
| `/bloodverse` | The Bloodverse \| UNHOLY CO. | The Bloodverse | Good | Correct | Thin gateway page |
| `/contact` | Contact \| UNHOLY CO. | Summon the Coven | Good | Correct | Creative H1, not search-friendly |
| `/legal` | Legal -- UNHOLY CO. \| UNHOLY CO. | The fine print. | Good | **WRONG (→ /)** | Double brand, wrong canonical, wrong OG |
| `/bloodverse/chapter-1` | Chapter I: The Reaper Knocks \| UNHOLY CO. | Bloodverse · Chapter I | Good | Correct | No Article schema |

### Internal Linking

Navigation includes all key pages. Footer links to legal and contact. Cross-page CTAs present (shop links from product pages, Bloodverse links from story). No orphaned pages detected in the sitemap.

**Missing:** No breadcrumb navigation (visual or schema).

---

## 4. Schema / Structured Data (35/100)

### Present

| Schema | Location | Status |
|--------|----------|--------|
| Organization | layout.tsx (all pages) | Valid, minor improvements needed |
| WebSite | layout.tsx (all pages) | Valid, missing publisher ref |
| Product | /bloodthirst | **BROKEN: AggregateOffer missing lowPrice/highPrice** |

### Missing (by priority)

| Schema | Pages | Impact |
|--------|-------|--------|
| Fix AggregateOffer | /bloodthirst | **Critical** -- enables Product rich result |
| Product + ItemList | /shop | **High** -- rich results on conversion page |
| BreadcrumbList | All pages | **High** -- breadcrumb rich results |
| WebPage + Product | / (homepage) | Medium |
| Article | /bloodverse/chapter-* | Medium -- content indexing + AI citation |
| Enhanced Organization | layout.tsx | Low -- knowledge panel eligibility |

### 10 pages have zero page-specific schema (only global Organization + WebSite).

Ready-to-use JSON-LD blocks for all recommendations are in `seo-audit-output/schema.md`.

---

## 5. Performance / Core Web Vitals (40/100)

### Server Response: Excellent
- Homepage TTFB: 112ms
- Bloodthirst TTFB: 207ms
- HTTP/2 103 Early Hints active
- Cloudflare Pages edge delivery working well

### LCP: Poor (est. 2.5-3.5s homepage, 3.0-4.5s /bloodthirst)

Root causes:
1. **Preloader blocks content for 1,800ms** on first visit (z-200 overlay)
2. **`images.unoptimized: true`** -- raw PNGs, no WebP/AVIF, no srcset
3. **Heavy global JS**: GSAP + Framer Motion (~73 KB), PostHog + Sentry (~85 KB), Lenis -- all parse before LCP
4. **`<link rel="expect">` blocks all rendering** until React hydrates
5. Hero H1 starts at `opacity: 0` with 320ms JS delay

### INP: Borderline (est. 150-350ms)

Root causes:
1. 44 individual `useTransform` scroll subscriptions on homepage hero (BloodLetter)
2. Dual animation libs: GSAP (~28 KB) + Framer Motion (~45 KB) on every page
3. Lenis smooth scroll + Framer Motion scroll listeners = two-layer processing
4. PostHog + Sentry (with session replay ~60 KB) initialized eagerly
5. Three.js `useFrame` callbacks on /bloodthirst compete with interactions

### CLS: Good (est. 0.02-0.08)

- Images have explicit dimensions
- Font preloads via 103 Early Hints mitigate FOUT
- Preloader accidentally shields first-paint shifts

### Estimated JS Bundle Sizes

| Library | Gzipped | Scope |
|---------|---------|-------|
| Next.js runtime | ~90 KB | All pages |
| Framer Motion | ~45 KB | All pages |
| GSAP | ~28 KB | All pages (1 component) |
| Sentry + replay | ~60 KB | All pages |
| PostHog | ~25 KB | All pages |
| Three.js | ~150 KB | /bloodthirst only (lazy) |
| **Homepage total** | **~330-380 KB** | |
| **/bloodthirst total** | **~550-650 KB** | |

### Quick Performance Wins (< 1 hour)

1. Reduce preloader: 1800ms → 600ms
2. Add `fetchPriority="high"` to hero can.png
3. Wrap PostHog/Sentry in `requestIdleCallback`
4. Reduce feTurbulence octaves: 4 → 2
5. Remove `will-change` from HeartbeatGlow
6. Audit vanta/lottie-react -- remove if unused

---

## 6. Images (45/100)

### Issues

- `images.unoptimized: true` disables all Next.js image optimization
- All images served as original PNG format at full resolution
- No WebP/AVIF variants generated
- No responsive srcset for different screen sizes
- `/og-hero.png` and `/og.png` deleted from repo but referenced in metadata

### Passing

- Alt text present on key images (logo, product can)
- Explicit width/height attributes prevent CLS
- Hero image uses `priority` prop (eager loading)
- 3D texture uses WebP format (bloodthirst-texture.webp)

---

## 7. AI Search Readiness (35/100)

### What works
- Organization schema provides entity info
- Product specs are structured in grids
- Story page blockquote is cleanly quotable
- Pack pricing is clearly structured

### What fails
- No FAQ content on any page (highest-value for AI citation)
- No declarative product definition ("BloodThirst is a...")
- Headings are creative, not descriptive (invisible to AI extraction)
- No comparison content for "vs" queries
- No structured nutrition/mineral data
- Missing FAQ, BreadcrumbList, NutritionInformation schemas

---

## Scoring Summary

| Category | Score | Status |
|----------|-------|--------|
| Technical SEO | 38/100 | FAIL -- middleware blocks all production URLs |
| Content Quality | 58/100 | NEEDS WORK -- thin pages, missing trust signals |
| On-Page SEO | 52/100 | MODERATE -- strong meta tags, weak H1s + content |
| Schema | 35/100 | FAIL -- broken Product schema, 10 pages with none |
| Performance | 40/100 | NEEDS WORK -- preloader + heavy JS hurt LCP/INP |
| Images | 45/100 | NEEDS WORK -- optimization disabled |
| AI Readiness | 35/100 | FAIL -- no FAQ, no factual definitions |
| **Overall** | **42/100** | |

---

## What's Working Well

1. **Brand voice** -- distinctive, authentic, well-crafted copy
2. **Security headers** -- A+ security posture (HSTS preload, CSP, X-Frame-Options)
3. **Server response** -- 112ms TTFB, excellent edge delivery
4. **URL structure** -- clean, logical hierarchy
5. **Sitemap** -- complete, valid, proper priority assignment
6. **robots.txt** -- well-configured with AI crawler blocking
7. **Meta tags** -- consistent OG/Twitter cards across most pages
8. **CLS** -- good layout stability from explicit image dimensions

## What Needs Immediate Attention

1. **Remove middleware teaser rewrite** (or noindex + remove sitemap)
2. **Restore OG images** before next deploy
3. **Fix legal page metadata** (canonical, OG, title)
4. **Add trust signals** (FSSAI, address, GSTIN)
5. **Fix Product schema** (add prices)
6. **Reduce preloader duration** and defer analytics
