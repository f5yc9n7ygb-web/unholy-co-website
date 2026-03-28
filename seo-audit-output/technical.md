# Technical SEO Audit -- UNHOLY CO.

**Audit Date:** 2026-03-22
**URLs Audited:** https://unholy-co-website.pages.dev/ (staging), https://theunholy.co/ (production)
**Stack:** Next.js 15 App Router, React 18, Cloudflare Pages (OpenNext)
**Technical Score: 38 / 100**

---

## Executive Summary

The site has critical architectural SEO problems that will prevent meaningful organic visibility. The production domain (theunholy.co) rewrites all requests to a teaser page via middleware, yet the sitemap and robots.txt declare 11 full-site URLs on that same domain. This means Google is being told to crawl pages that do not exist on the canonical domain. Security headers are excellent. Core Web Vitals face high risk from heavy JS dependencies (GSAP, Framer Motion, Three.js/R3F) and the preloader blocking initial paint.

---

## 1. Crawlability

**Status: FAIL**

### Critical: Middleware Rewrites Break All Production URLs

The middleware at `src/middleware.ts` (lines 23-49) rewrites every request to theunholy.co to the `/teaser` route. This means:

- `https://theunholy.co/shop` --> serves the teaser page (not the shop)
- `https://theunholy.co/bloodthirst` --> serves the teaser page (not the product page)
- All 11 URLs declared in the sitemap are unreachable on the production domain

Yet the sitemap (`src/app/sitemap.ts`) and `metadataBase` in the root layout both point to `https://theunholy.co`. Google will crawl these URLs, receive teaser content, and likely deindex them as duplicate thin pages.

**Fix:** When you are ready to launch the full site on theunholy.co, remove the teaser rewrite from middleware. Until then, either:
- Add `noindex` to the teaser page and remove the sitemap from robots.txt, OR
- Point the sitemap to the pages.dev domain (not recommended long-term)

### robots.txt

| Check | Status |
|-------|--------|
| Accessible at /robots.txt | PASS |
| Blocks /api/ | PASS |
| Blocks internal routes (/v2, /v3, /shop-v2) | PASS |
| Blocks AI training crawlers (GPTBot, Google-Extended, Bytespider, CCBot) | PASS |
| Sitemap declared | PASS |
| /teaser not blocked (should be) | FAIL |
| /qr and /thanks not blocked (utility pages) | FAIL |

**Fix:** Add these to robots.txt:
```
Disallow: /teaser
Disallow: /qr
Disallow: /thanks
```

### Sitemap

| Check | Status |
|-------|--------|
| 11 URLs, valid XML | PASS |
| lastModified uses `new Date()` (dynamic) | PASS |
| Priority assignment logical | PASS |
| All URLs use theunholy.co base | See critical issue above |
| Missing /legal in sitemap | Already present (priority 0.3) |

---

## 2. Indexability

**Status: FAIL**

### Critical: Legal Page Canonical Points to Homepage

**Rendered output confirms:**
```
<link rel="canonical" href="https://theunholy.co"/>
```

The legal page (`/legal`) has no `alternates.canonical` override in its metadata export. Next.js falls back to the root layout's `alternates: { canonical: '/' }`, which resolves to the base URL. Google will treat `/legal` as a duplicate of the homepage.

**File:** `src/app/legal/page.tsx` (lines 4-8)
**Fix:** Add `alternates: { canonical: '/legal' }` to the legal page metadata.

### Critical: Legal Page Title Has Double Brand Suffix

**Rendered:**
```
<title>Legal -- UNHOLY CO. | UNHOLY CO.</title>
```

The page sets `title: "Legal -- UNHOLY CO."` but the root layout template is `%s | UNHOLY CO.`. This stacks the brand name.

**Fix:** Change the legal page title to just `"Legal"`. The template will produce `Legal | UNHOLY CO.`.

### Critical: Legal Page OG Tags Show Homepage Content

All OG and Twitter tags on `/legal` fall through to root layout defaults:
- `og:title` = "UNHOLY CO. -- BloodThirst" (not legal page)
- `og:url` = "https://theunholy.co" (not /legal)
- `og:image` = "/og-hero.png" (generic, not page-specific)

**Fix:** Add explicit `openGraph` and `twitter` metadata to the legal page export, or at minimum set the OG URL and title.

### Medium: Teaser Page Title Also Has Double Branding

**Rendered:** `Something Unholy Is Coming -- UNHOLY CO. | UNHOLY CO.`
Same root cause. The teaser page sets `title: "Something Unholy Is Coming -- UNHOLY CO."`.

**Fix:** Change to `title: "Something Unholy Is Coming"`.

### OG Image Across All Pages

Every page references `/og-hero.png` for OG images. Git status shows `D public/og-hero.png` (deleted). However, the current deployment still serves this file (HTTP 200). This is a ticking time bomb -- the next deploy will break all social sharing previews site-wide.

**Fix:** Either restore `og-hero.png` to the repo or update all page metadata to reference a new image file.

---

## 3. Security Headers

**Status: PASS (Excellent)**

| Header | Value | Status |
|--------|-------|--------|
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | PASS |
| Content-Security-Policy | frame-ancestors 'none'; base-uri 'self'; ... | PASS |
| X-Frame-Options | DENY | PASS |
| X-Content-Type-Options | nosniff | PASS |
| Referrer-Policy | strict-origin-when-cross-origin | PASS |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | PASS |
| Cross-Origin-Opener-Policy | same-origin | PASS |

**Notes:**
- CSP does not include `script-src` or `style-src` directives. This is a conscious trade-off for Next.js compatibility (inline scripts), but worth noting.
- The `X-Powered-By: Next.js` header leaks the framework. Low risk but unnecessary information disclosure.

**Fix (low priority):** Add `poweredByHeader: false` to `next.config.mjs` to suppress `X-Powered-By`.

---

## 4. HTTPS and Redirects

**Status: PASS**

| Check | Status |
|-------|--------|
| HTTP to HTTPS redirect (theunholy.co) | PASS (301) |
| HSTS with preload | PASS |
| No redirect chains detected | PASS |
| CSP includes upgrade-insecure-requests | PASS |

---

## 5. URL Structure

**Status: PASS (with notes)**

| Check | Status |
|-------|--------|
| Clean, lowercase URLs | PASS |
| No query parameters for content | PASS |
| Logical hierarchy (/bloodverse/chapter-1) | PASS |
| No trailing slashes | PASS |

**Note:** The `/v2` route returns HTTP 404, not a redirect or block at the server level. The robots.txt `Disallow: /v2` prevents crawling, but if a link to /v2 exists somewhere, Google will still discover the 404. This is acceptable behavior -- 404 is the correct signal for a removed page.

---

## 6. Mobile Friendliness

**Status: PASS**

| Check | Status |
|-------|--------|
| `<meta name="viewport" content="width=device-width, initial-scale=1"/>` | PASS |
| `<html lang="en">` | PASS |
| Responsive typography (vw units, md: breakpoints) | PASS |
| Font display: swap (Inter, Cinzel) | PASS |
| Images use Next.js `<Image>` component | PASS (but unoptimized mode) |

**Note:** `images.unoptimized: true` in next.config.mjs means no automatic WebP/AVIF conversion, no responsive srcset, and no lazy loading optimization from Next.js. All images serve at their original format and size.

**Fix (medium priority):** If moving off Cloudflare Pages or enabling Cloudflare Image Resizing, switch `unoptimized` back to `false`.

---

## 7. Core Web Vitals Risk Assessment

**Status: HIGH RISK**

### LCP (Largest Contentful Paint) -- Risk: HIGH

**Concerns:**
- The homepage hero text ("BLOODTHIRST") is rendered via Framer Motion `<motion.h1>` with `initial={{ opacity: 0, rotateX: 88 }}`. The LCP element starts invisible and only appears after a 320ms JS timeout + staggered animation (0.12s + index * 0.055s per letter). This delays LCP significantly.
- The `<Preloader>` component runs on first visit (sessionStorage gate) at z-[200], covering all content.
- 22 async `<script>` tags load on the homepage. Even with `async`, parsing and executing this volume of JS competes for main thread time.
- The `<link rel="expect" href="#_R_" blocking="render"/>` tag in the HTML explicitly blocks rendering until React hydrates, further delaying LCP.
- Three.js/R3F on `/bloodthirst` page loads .glb models (3D assets), adding to bundle weight.

**Estimated LCP:** 3.5-6s on 4G mobile (Poor)

### INP (Interaction to Next Paint) -- Risk: MEDIUM-HIGH

**Concerns:**
- GSAP page transitions (`TransitionContext.tsx`) run ~1.4s of synchronous animation on every navigation, blocking the main thread during route changes.
- Lenis smooth scroll adds a rAF loop that runs continuously.
- Framer Motion scroll-linked animations (useScroll, useTransform, useSpring) on the homepage hero create per-frame layout recalculations.
- The GSAP two-panel exit animation (blood + dark panels) fires before `router.push()`, meaning any click on an internal link has at minimum ~550ms of JS-driven animation before navigation begins.

**Estimated INP:** 250-500ms on mid-tier mobile (Needs Improvement to Poor)

### CLS (Cumulative Layout Shift) -- Risk: LOW-MEDIUM

**Concerns:**
- Font display: swap on two Google Fonts (Inter, Cinzel) can cause a flash of unstyled text. However, both fonts are preloaded via `<link>` headers (HTTP 103 Early Hints), which mitigates this.
- The `will-change: transform` usage (13 occurrences across 4 files) is appropriate and promotes elements to compositor layers, reducing unexpected shifts.
- Images use explicit width/height attributes, preventing layout shift from image loading.

**Estimated CLS:** < 0.1 (Good), assuming fonts load before FCP

### Recommendations

1. **Remove the opacity:0 initial state from the H1.** Let the LCP text render immediately in its final color, then enhance with animation. This alone could save 500-800ms on LCP.
2. **Defer the preloader on return visits** (already done via sessionStorage), but ensure it does not block LCP paint even on first visit -- consider making it an overlay that does not prevent text rendering.
3. **Code-split Three.js/R3F** to only load on the /bloodthirst route (appears to already be done via dynamic import in BloodThirstClient).
4. **Reduce JS bundle count.** 22 async scripts on the homepage is excessive. Review chunk splitting configuration.

---

## 8. Structured Data

**Status: PASS (with gaps)**

### Present

| Schema | Location | Valid |
|--------|----------|-------|
| Organization | Root layout (all pages) | PASS |
| WebSite | Root layout (all pages) | PASS |
| Product | /bloodthirst page | PASS (missing price range in AggregateOffer) |

### Missing

| Schema | Recommended For |
|--------|----------------|
| BreadcrumbList | /bloodverse/chapter-* pages (nested hierarchy) |
| FAQPage | /legal page (if structured as Q&A) |
| WebPage | Each page (basic, but helps Google understand page types) |

**Fix for Product schema:** The `AggregateOffer` in `/bloodthirst/page.tsx` (line 37) is missing `lowPrice` and `highPrice`. Google requires at least one price property for rich results.

```typescript
offers: {
  '@type': 'AggregateOffer',
  priceCurrency: 'INR',
  lowPrice: '99',
  highPrice: '999',
  availability: 'https://schema.org/InStock',
  url: 'https://theunholy.co/shop',
},
```

---

## 9. JavaScript Rendering (CSR vs SSR)

**Status: HYBRID (SSR shell + CSR content)**

Next.js 15 App Router provides server-side rendering for the page shell and metadata. However, all interactive content is in `"use client"` components:

| Page | Server Component | Client Component |
|------|-----------------|-----------------|
| / (homepage) | page.tsx (wrapper only) | HomeHero, Showcase, Manifesto, HorizontalRitual, CTA |
| /bloodthirst | page.tsx (metadata + ld+json) | BloodThirstClient (entire page) |
| /shop | page.tsx (reads env var) | ShopClient (entire page) |
| /legal | page.tsx (metadata only) | LegalClient (entire page) |
| /teaser | page.tsx (metadata only) | TeaserClient (entire page) |

**Impact:** Googlebot can render JavaScript, but the initial HTML response contains almost no meaningful content for most pages -- just metadata, ld+json, and empty component shells. If JS fails to execute (timeout, error), the page is blank.

**Specific concern:** The `<link rel="expect" href="#_R_" blocking="render"/>` tag in the HTML output means the browser will not paint anything until React completes hydration. This is a Next.js 15 feature (blocking rendering until Suspense boundaries resolve), but it makes the site entirely dependent on JS execution for any visual output.

**Fix:** For key landing pages (/bloodthirst, /shop), consider moving static text content to server components so that meaningful HTML is present in the initial response, even if animations are client-only.

---

## 10. IndexNow Protocol

**Status: NOT IMPLEMENTED**

No IndexNow key file detected, no API integration found. Given the site deploys on Cloudflare Pages, IndexNow could be triggered from a deploy hook.

**Fix (low priority):** Add IndexNow integration for Bing and Yandex:
1. Generate an API key and place it at `/public/{key}.txt`
2. POST to `https://api.indexnow.org/indexnow` on each deploy with the changed URLs

---

## Prioritized Issue List

### Critical (Fix Immediately)

| # | Issue | Impact |
|---|-------|--------|
| C1 | Middleware rewrites all theunholy.co traffic to teaser -- sitemap URLs unreachable | All 11 sitemap URLs serve wrong content to Google |
| C2 | OG image (og-hero.png) deleted from git -- will break on next deploy | All social sharing previews will 404 |
| C3 | Legal page canonical points to homepage | Google may deindex /legal or treat as duplicate |
| C4 | Legal page OG tags show homepage content | Wrong content in social shares |
| C5 | Legal + Teaser title double-branding | Unprofessional SERP appearance |

### High (Fix This Sprint)

| # | Issue | Impact |
|---|-------|--------|
| H1 | LCP hero text starts at opacity:0, requires JS + 320ms timeout | LCP likely > 4s on mobile (Poor) |
| H2 | 22 async script tags on homepage | Main thread contention, delayed TTI |
| H3 | Render-blocking `<link rel="expect">` requires full hydration before paint | Zero content visible without JS |
| H4 | Product schema missing price in AggregateOffer | No rich results eligibility |
| H5 | Pages.dev domain not canonicalized away from production | Potential duplicate indexing if pages.dev gets crawled |

### Medium (Fix This Month)

| # | Issue | Impact |
|---|-------|--------|
| M1 | /teaser, /qr, /thanks not blocked in robots.txt | Wasted crawl budget on utility pages |
| M2 | images.unoptimized: true -- no WebP, no srcset | Larger image payloads on mobile |
| M3 | X-Powered-By header exposes Next.js | Minor information leak |
| M4 | GSAP page transitions block main thread ~1.4s per navigation | INP degradation on internal links |
| M5 | No BreadcrumbList schema for nested Bloodverse chapters | Missing rich result opportunity |

### Low (Backlog)

| # | Issue | Impact |
|---|-------|--------|
| L1 | No IndexNow integration | Slower re-indexing after deploys |
| L2 | CSP missing script-src/style-src | Security hardening opportunity |
| L3 | cache-control: no-cache on HTML pages | Expected for dynamic SSR, but static pages could benefit from caching |
| L4 | No hreflang tags (single-language site) | N/A unless expanding to other locales |

---

## Files Referenced

- `/Users/aakashsingh/Downloads/unholy-co-website/src/middleware.ts` -- Teaser rewrite logic (lines 23-49)
- `/Users/aakashsingh/Downloads/unholy-co-website/src/app/layout.tsx` -- Root metadata, structured data, canonical fallback (lines 27-72)
- `/Users/aakashsingh/Downloads/unholy-co-website/src/app/legal/page.tsx` -- Missing canonical, OG overrides (lines 4-8)
- `/Users/aakashsingh/Downloads/unholy-co-website/src/app/teaser/page.tsx` -- Double-branded title (line 5)
- `/Users/aakashsingh/Downloads/unholy-co-website/src/app/bloodthirst/page.tsx` -- Product schema missing price (lines 35-39)
- `/Users/aakashsingh/Downloads/unholy-co-website/src/components/home/HomeHero.tsx` -- LCP-blocking animation (lines 82-83, 100-103)
- `/Users/aakashsingh/Downloads/unholy-co-website/src/app/sitemap.ts` -- All 11 URLs pointing to theunholy.co
- `/Users/aakashsingh/Downloads/unholy-co-website/public/robots.txt` -- Missing /teaser, /qr, /thanks blocks
- `/Users/aakashsingh/Downloads/unholy-co-website/next.config.mjs` -- Security headers config, unoptimized images
