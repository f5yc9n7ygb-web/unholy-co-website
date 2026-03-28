# Performance & Core Web Vitals Audit

**Site:** https://unholy-co-website.pages.dev/
**Date:** 2026-03-22
**Stack:** Next.js 15 App Router, React 18, Tailwind CSS, GSAP 3, Framer Motion 11, Three.js/R3F, Lenis, Cloudflare Pages

---

## 1. Server Response (TTFB)

| Page | TTFB | Total Load | HTML Size |
|------|------|-----------|-----------|
| `/` (homepage) | **112ms** | 170ms | 67.6 KB |
| `/bloodthirst` | **207ms** | 220ms | 42.9 KB |

**Verdict:** TTFB is excellent. Cloudflare Pages edge delivery keeps server response well under the 200ms ideal for the homepage. The bloodthirst page is slightly slower but still within acceptable range. HTTP/2 103 Early Hints are active, preloading fonts and key images -- this is a strong setup.

**Issue:** `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` on HTML responses means every page visit hits the origin. Since `revalidate = 60` is set on the homepage, the HTML should be cacheable at the edge for up to 60 seconds. This is likely an OpenNext/Cloudflare adapter default that should be overridden.

---

## 2. Core Web Vitals Estimates

### LCP (Largest Contentful Paint) -- Estimated: 2.5-3.5s (Needs Improvement)

**LCP Element (Homepage):** The `<h1>BLOODTHIRST</h1>` text or the `/can.png` hero image, depending on viewport.

**Problems identified:**

1. **Preloader blocks LCP for 1.8 seconds on first visit.** The `Preloader` component renders a fixed z-200 overlay with `DISPLAY_DURATION = 1800ms`. The actual page content (the LCP element) is painted behind this overlay but is not visible to the user -- and Lighthouse will flag the preloader's background gradient as the LCP instead of the real content. On first session visits, this alone pushes LCP past the 2.5s "good" threshold.

2. **`images.unoptimized: true` in next.config.mjs.** Every image is served as-is from `/public` with no resizing, format negotiation (WebP/AVIF), or responsive `srcset`. The `/can.png` hero image (marked `priority`) is likely a large uncompressed PNG delivered at full resolution to all devices including mobile.

3. **No `fetchpriority="high"` on LCP image.** While Next.js `priority` prop adds `loading="eager"`, explicit `fetchpriority="high"` gives the browser a stronger signal. The `can.png` image competes with two font preloads and two other image preloads (uhc-logo.png) via the 103 Early Hints header.

4. **Font loading impact.** Two Google Fonts are loaded (Inter with latin subset, Cinzel with 4 weights: 400/600/700/900). The `display: swap` strategy is correct, but Cinzel at 4 weights is heavy. The 103 Early Hints preload the WOFF2 files, which helps.

5. **Global layout components loaded eagerly.** Every page loads: `TransitionProvider` (GSAP), `Preloader` (Framer Motion + AnimatePresence), `HeartbeatGlow` (CSS animations), `ScrollProgress` (Framer Motion), `NoiseGrain` (SVG filter), `PostHogProvider` (PostHog + Sentry SDKs). All these initialize before the page-specific LCP content can render.

### INP (Interaction to Next Paint) -- Estimated: 150-350ms (Borderline)

**Problems identified:**

1. **Dual animation library overhead.** Both GSAP (~30 KB gzipped) and Framer Motion (~45 KB gzipped) are loaded on every page. Every component in the homepage tree uses Framer Motion (`motion.div` with `whileInView`, `useScroll`, `useTransform`, `useSpring`). The TransitionProvider uses GSAP. This means ~75 KB of animation JavaScript parses and executes on the main thread before any interaction is possible.

2. **Framer Motion's `useScroll` + `useTransform` on multiple components.** The homepage hero alone creates 12+ motion values (`useScroll`, `useTransform`, `useSpring`) that recompute on every scroll frame. The `BloodLetter` component creates 4 motion values per letter x 11 letters = 44 individual `useTransform` subscriptions on the homepage hero. These all fire on scroll events and can cause long tasks.

3. **Lenis smooth scroll intercepts native scrolling.** Lenis wraps the browser's native scroll behavior, adding a RAF loop that computes interpolated scroll positions. Combined with Framer Motion's scroll listeners, this creates a two-layer scroll processing pipeline.

4. **PostHog + Sentry initialized eagerly.** `PostHogProvider` calls `posthog.init()` and `Sentry.init()` with replay integration in a `useEffect` on mount. Sentry replay integration alone is ~40-60 KB and instruments the DOM for session recording. This contends with user interaction responsiveness.

5. **Three.js on /bloodthirst.** The entire Three.js runtime (~150 KB gzipped), React Three Fiber, and drei are loaded. While `CinematicCanScene` is dynamically imported with `ssr: false` (good), the bundle still parses on the main thread after hydration. The `useFrame` callbacks in `CameraRig`, `CanGroup`, and `ParallaxKeyLight` run every animation frame (~60fps), which can starve the main thread if a user tries to interact during 3D rendering.

6. **No `requestIdleCallback` or task-yielding.** Heavy initialization (animation setup, 3D scene prep, analytics) all runs during the critical hydration window without yielding to the main thread.

### CLS (Cumulative Layout Shift) -- Estimated: 0.02-0.08 (Good)

**Mostly well-handled, with some risks:**

1. **Font swap flash (FOUT).** `display: 'swap'` on both fonts means text renders immediately in fallback fonts, then shifts when Inter/Cinzel load. Cinzel (serif decorative) to Inter (sans-serif) is a significant metric difference. However, the 103 Early Hints preload the fonts, reducing the window.

2. **The Preloader acts as a CLS shield.** On first visit, the 1.8s preloader overlay hides any below-the-fold layout shifts during initial render. This accidentally helps CLS but hurts LCP.

3. **Images have explicit dimensions.** The `can.png` hero image uses `width={260} height={450}`, and the Next.js `Image` component reserves space. Good.

4. **Dynamic content injection risk.** The `SiteChrome` component conditionally renders `Header` and applies `pt-20 md:pt-24` padding. If the header renders late, the content could shift down. Since it is a client component reading `usePathname()`, this is evaluated synchronously on mount, so the risk is low.

5. **`Suspense` fallback for 3D scene.** The `CinematicCanScene` loading fallback is a small centered pulse dot. When the 3D scene loads, it replaces this with a full Canvas element. Since both are inside an `absolute inset-0` container, this should not cause layout shift.

---

## 3. JavaScript Bundle Analysis

### Dependencies by estimated gzipped size:

| Library | Estimated gzip | Pages affected |
|---------|---------------|----------------|
| three.js | ~150 KB | /bloodthirst (lazy) |
| @react-three/fiber | ~45 KB | /bloodthirst (lazy) |
| @react-three/drei | ~30-60 KB | /bloodthirst (lazy) |
| framer-motion | ~45 KB | All pages |
| gsap | ~28 KB | All pages (TransitionProvider) |
| @sentry/nextjs + replay | ~60 KB | All pages |
| posthog-js | ~25 KB | All pages |
| lenis | ~8 KB | All pages |
| react + react-dom | ~42 KB | All pages |
| next.js runtime | ~90 KB | All pages |
| vanta | ~15 KB | Unknown (imported?) |
| lottie-react | ~30 KB | Unknown (imported?) |

**Estimated total JS for homepage:** ~330-380 KB gzipped
**Estimated total JS for /bloodthirst:** ~550-650 KB gzipped

### Key concern: `vanta` and `lottie-react` in package.json

These libraries are listed as dependencies but it is unclear if they are actively used or are dead imports. If they are tree-shaken away, no harm. If imported anywhere in the client bundle, they add ~45 KB gzipped combined. `vanta` depends on Three.js, which would pull the full Three.js bundle into pages that do not need 3D rendering.

---

## 4. Architecture-Level Issues

### 4.1 Preloader Delays Real Content

The `Preloader` component displays for 1.8 seconds on first session visit (gated by `sessionStorage`). This is a user experience choice but directly conflicts with LCP measurement. Google's CrUX data measures real user experience, and 1.8 seconds of overlay before any meaningful content appears will be captured as poor LCP.

**Impact:** +1.8s to LCP on first visit (likely 20-40% of all visits depending on session duration patterns).

### 4.2 Animation Library Duplication

GSAP is used exclusively for the page transition curtain (TransitionProvider). Framer Motion is used for everything else: scroll animations, entrance animations, presence animations, springs. Both ship to every page.

**Impact:** ~28 KB extra gzipped JavaScript (GSAP) loaded on every page for a single component.

### 4.3 Global Layout Weight

Every page render includes these fixed overlays:
- `TransitionProvider` -- two full-screen divs (curtain panels) + GSAP import
- `Preloader` -- Framer Motion AnimatePresence + logo image (first visit)
- `HeartbeatGlow` -- two fixed div overlays with CSS animations + `will-change: opacity, transform`
- `ScrollProgress` -- Framer Motion `useScroll` + `useSpring` (runs every frame)
- `NoiseGrain` -- fixed SVG with `feTurbulence` filter at z-300
- `PostHogProvider` -- initializes PostHog + Sentry with session replay

The SVG noise grain filter (`feTurbulence` with 4 octaves at 0.80 base frequency) is particularly expensive on mobile GPUs. It covers the full viewport at `z-index: 300` with `mix-blend-mode: soft-light`. This forces the compositor to blend every pixel on every frame.

### 4.4 Image Optimization Disabled

`images.unoptimized: true` in `next.config.mjs` disables Next.js Image Optimization. This means:
- No automatic WebP/AVIF conversion
- No responsive `srcset` generation
- No lazy loading optimization (beyond `loading="lazy"` attribute)
- `/can.png`, `/uhc-logo.png`, and all other images served as original format/size

This is likely set because Cloudflare Pages does not support Next.js's built-in image optimizer. However, the images could be pre-optimized at build time or served through Cloudflare Image Resizing.

### 4.5 3D Assets on /bloodthirst

The page correctly preloads 3D assets via `<link rel="preload">`:
- `/bloodthirst.glb` -- 3D model
- `/bloodthirst-texture.webp` -- texture (good: WebP format)
- `/env.hdr` -- HDR environment map

And the `CinematicCanScene` is dynamically imported with `ssr: false`. These are good patterns. However, the `useGLTF.preload()` and `useTexture.preload()` calls at module scope in `CinematicCanScene.tsx` will trigger fetches as soon as the dynamic import chunk evaluates, before the component mounts -- this is actually beneficial for loading speed.

### 4.6 Cache Headers

The HTML response sets `Cache-Control: private, no-cache, no-store` despite `revalidate = 60` on the homepage. Static assets served from `/_next/static/` likely have proper immutable caching via Cloudflare, but the HTML itself is never cached at the edge.

### 4.7 Missing OG Image

The metadata references `/og-hero.png` for Open Graph images, but git status shows `public/og-hero.png` and `public/og.png` are deleted. This will produce 404 errors for social media crawlers.

---

## 5. Prioritized Recommendations

### P0 -- Critical (Expected impact: major LCP and INP improvement)

**1. Reduce or eliminate the preloader on non-first-paint scenarios.**

The preloader adds 1.8s to LCP. Consider:
- Reducing `DISPLAY_DURATION` from 1800ms to 800ms maximum
- Using CSS-only animation (remove Framer Motion AnimatePresence from preloader)
- Making it interruptible: dismiss on first user interaction
- Using `requestIdleCallback` to schedule the dismissal
- Alternatively, use a skeleton/placeholder approach that does not obscure the LCP element

**2. Pre-optimize images at build time.**

Since Next.js image optimization is disabled for Cloudflare:
- Convert `/can.png` to WebP/AVIF with responsive sizes (320w, 640w, 1024w)
- Use `<picture>` with `srcset` for the hero image
- Compress `/uhc-logo.png`
- Add explicit `width` and `height` to all images (already done in most places)
- Consider Cloudflare Image Resizing ($5/month) for automatic format negotiation

**3. Defer third-party analytics initialization.**

Move PostHog and Sentry initialization behind `requestIdleCallback` or delay by 3-5 seconds:
```typescript
useEffect(() => {
  const init = () => {
    if (key) posthog.init(key, { ... })
    if (dsn) Sentry.init({ ... })
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(init, { timeout: 5000 })
  } else {
    setTimeout(init, 3000)
  }
}, [])
```
This prevents Sentry replay (40-60 KB) from competing with hydration.

### P1 -- High (Expected impact: moderate INP and bundle improvement)

**4. Replace GSAP with Framer Motion for page transitions.**

The `TransitionProvider` curtain effect (scaleY 0->1, wordmark fade) can be implemented with Framer Motion's `useAnimate` hook. This eliminates ~28 KB gzipped GSAP from every page load.

**5. Reduce Cinzel font weights.**

Cinzel is loaded with weights 400, 600, 700, and 900. Audit actual usage:
- If only 2-3 weights are used, remove unused ones
- Each weight adds ~15-25 KB of font data
- Consider using `font-weight: bold` (700) with `font-synthesis` for faux-bold variants

**6. Remove or lazy-load `vanta` and `lottie-react`.**

If these packages are not actively used, remove them from `package.json`. If used on specific pages only, ensure they are dynamically imported. `vanta` pulls in Three.js as a dependency, which would add ~150 KB to any page that imports it.

**7. Optimize the SVG noise grain overlay.**

The `feTurbulence` SVG filter with 4 octaves at `z-index: 300` forces full-viewport pixel blending on every paint. Options:
- Reduce to 2 octaves (halves computation)
- Use a pre-rendered noise texture (static PNG/WebP tiled) instead of live SVG filter
- Reduce opacity further or disable on mobile
- Add `@media (prefers-reduced-motion: reduce)` to hide it

**8. Throttle `HeartbeatGlow` `will-change` on mobile.**

The `will-change: opacity, transform` on two fixed full-viewport divs forces the GPU to allocate and composite two extra layers covering the entire screen. On mobile, this consumes significant GPU memory. Consider:
- Removing `will-change` (CSS animations still work, the browser just optimizes lazily)
- Hiding the effect on mobile with a media query
- Using a single div instead of two

### P2 -- Medium (Expected impact: incremental improvements)

**9. Reduce Framer Motion scroll subscriptions in HomeHero.**

The `BloodLetter` component creates 4 `useTransform` hooks per letter x 11 letters = 44 motion value subscriptions. Each recomputes on every scroll event. Refactor to:
- Compute all letter styles in a single parent `useTransform` callback
- Use CSS `@property` animations driven by a single scroll-linked variable
- Or batch the calculations in a single `useMotionValueEvent` handler

**10. Set proper cache headers for HTML.**

Override the OpenNext default to allow edge caching of ISR pages:
```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```
This would allow Cloudflare to serve cached HTML for 60 seconds with stale-while-revalidate, reducing TTFB from ~112ms to ~10ms for warm cache hits.

**11. Add `fetchpriority="high"` to the LCP image.**

For the homepage hero `can.png`:
```tsx
<Image
  src="/can.png"
  alt="BLOODTHIRST by UNHOLY CO."
  width={260}
  height={450}
  priority
  fetchPriority="high"
/>
```

**12. Implement `content-visibility: auto` on below-the-fold sections.**

Add to the `HomeShowcase`, `HomeManifesto`, `HomeRitual`, and `HomeCTA` wrapper elements:
```css
.lazy-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 800px;
}
```
This skips rendering of off-screen sections until they approach the viewport, reducing initial paint work.

**13. Fix missing OG images.**

`/og-hero.png` and `/og.png` are deleted from `public/`. Either restore them or update the metadata in `layout.tsx` and `bloodthirst/page.tsx` to point to existing assets.

### P3 -- Low (Polish)

**14. Reduce `backdrop-blur-xl` usage.**

The `.glass-panel` utility applies `backdrop-blur-xl` (24px blur). Each usage forces the compositor to blur the underlying content in real-time. On the homepage, the Showcase section renders 7+ glass panels. Consider:
- Reducing blur radius to `backdrop-blur-sm` (4px)
- Using a semi-opaque solid background instead on mobile
- Applying blur only on hover/focus

**15. Lazy-load Lenis smooth scroll.**

Lenis is not critical for first paint. Load it after the page is interactive:
```typescript
useEffect(() => {
  import('lenis').then(({ default: Lenis }) => {
    const lenis = new Lenis()
    // ... setup
  })
}, [])
```

---

## 6. Estimated Scores

### Homepage (`/`)

| Metric | Current Estimate | After P0 Fixes | Target |
|--------|-----------------|----------------|--------|
| LCP | 2.5-3.5s | 1.5-2.2s | <=2.5s |
| INP | 150-350ms | 100-200ms | <=200ms |
| CLS | 0.02-0.08 | 0.01-0.05 | <=0.1 |
| Performance Score | 45-60 | 70-85 | 90+ |

### Bloodthirst (`/bloodthirst`)

| Metric | Current Estimate | After P0 Fixes | Target |
|--------|-----------------|----------------|--------|
| LCP | 3.0-4.5s | 2.0-3.0s | <=2.5s |
| INP | 200-500ms | 150-300ms | <=200ms |
| CLS | 0.01-0.05 | 0.01-0.03 | <=0.1 |
| Performance Score | 30-50 | 55-70 | 80+ |

### Key Observations

- **CLS is the strongest metric.** Explicit image dimensions, sticky containers, and the preloader accidentally shielding shifts mean CLS is likely passing at the 75th percentile.
- **LCP is the weakest metric** due to the preloader, unoptimized images, and heavy JS initialization blocking render.
- **INP is borderline.** The dual animation library setup, 44 scroll-linked motion values on the homepage, and eager analytics initialization create long tasks during the hydration window and ongoing scroll handling.
- The `/bloodthirst` page will have significantly worse INP due to Three.js's per-frame `useFrame` callbacks competing with user interactions.

---

## 7. Quick Wins (implement in <1 hour)

1. Reduce `DISPLAY_DURATION` in Preloader from 1800 to 600 (`src/components/ux/Preloader.tsx` line 8)
2. Add `fetchPriority="high"` to `can.png` in HomeHero (`src/components/home/HomeHero.tsx` line 181)
3. Wrap PostHog/Sentry init in `requestIdleCallback` (`src/components/providers/PostHogProvider.tsx` line 28)
4. Reduce `feTurbulence` octaves from 4 to 2 in NoiseGrain (`src/components/ux/NoiseGrain.tsx` line 5)
5. Remove `will-change` from HeartbeatGlow CSS (globals.css lines 584, 601)
6. Fix missing OG images in metadata (layout.tsx line 57, bloodthirst/page.tsx line 13)
7. Audit whether `vanta` and `lottie-react` are imported anywhere; remove from `package.json` if dead

---

*Note: These estimates are based on code analysis and curl timing tests. For definitive field data, check CrUX via [CrUX Vis](https://cruxvis.withgoogle.com) once the site has sufficient traffic on theunholy.co. For lab data, run `npx lighthouse https://unholy-co-website.pages.dev/ --output json` locally.*
