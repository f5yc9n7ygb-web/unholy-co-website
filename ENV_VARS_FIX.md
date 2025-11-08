# Environment Variables Fix - November 8, 2025

## Problem: Blank Page with ERR_HTTP_RESPONSE_CODE_FAILURE

The deployment was succeeding but the site showed a blank page with the error `ERR_HTTP_RESPONSE_CODE_FAILURE` in the browser console.

## Root Cause

The issue was caused by **incorrect usage of environment variables** in Next.js Server Components:

1. Form `action` attributes were using server-side environment variables like `process.env.WORKER_ENDPOINT`
2. These variables are **only available during the build process**, not at runtime in Cloudflare Workers
3. When the worker tried to render pages, these variables were `undefined`
4. The `undefined` values in the HTML caused the worker to crash with an unhandled exception
5. This resulted in `ERR_HTTP_RESPONSE_CODE_FAILURE` being returned to the browser

## The Fix

Changed all client-facing environment variables to use the `NEXT_PUBLIC_` prefix:

- `WORKER_ENDPOINT` → `NEXT_PUBLIC_WORKER_ENDPOINT`
- `WORKER_SUBSCRIBE_ENDPOINT` → `NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT`
- `WORKER_ORDER_ENDPOINT` → `NEXT_PUBLIC_WORKER_ORDER_ENDPOINT`

### Why This Works

1. **Next.js Build-Time Inlining**: Environment variables prefixed with `NEXT_PUBLIC_` are automatically inlined by Next.js during the build process
2. **Available at Runtime**: These values become hardcoded strings in the built JavaScript, so they're available even when `process.env` is empty
3. **Worker Compatibility**: Cloudflare Workers can serve the pre-built HTML with the inlined values without needing access to environment variables

## Files Changed

1. `.env.example` - Updated to use `NEXT_PUBLIC_` prefixes
2. `src/app/contact/page.tsx` - Updated ContactForm action prop
3. `src/app/drops/page.tsx` - Updated drop notification form actions
4. `src/app/page.tsx` - Updated homepage subscribe form action
5. `src/app/qr/page.tsx` - Updated QR page form action
6. `src/app/shop/ShopClient.tsx` - Updated order endpoint
7. `src/components/layout/Footer.tsx` - Updated footer subscribe form action

## Setting Environment Variables in Cloudflare Pages

**IMPORTANT:** After merging this PR, you need to update the environment variables in Cloudflare Pages:

1. Go to your Cloudflare Pages dashboard
2. Navigate to: **Settings → Environment Variables**
3. Add the following variables (for Production and Preview environments):

```bash
NEXT_PUBLIC_WORKER_ENDPOINT=https://your-worker.workers.dev/submit
NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT=https://your-worker.workers.dev/submit
NEXT_PUBLIC_WORKER_ORDER_ENDPOINT=https://your-worker.workers.dev/order
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

4. After adding the variables, **trigger a new deployment** (or re-deploy the current commit)

### Note on Public Variables

These environment variables are **public** because they're exposed in the browser anyway (visible in HTML source and form actions). They should only contain:

- API endpoints that are meant to be called from the browser
- Public API keys (like Razorpay's public key)

**DO NOT** put secret keys or sensitive data in `NEXT_PUBLIC_` variables as they will be visible to anyone who views your site's source code.

## Testing the Fix

After setting the environment variables and deploying:

1. Visit your site (e.g., `https://unholy-co-website.pages.dev`)
2. The page should load properly (no blank page)
3. Open browser DevTools → Console - should see no `ERR_HTTP_RESPONSE_CODE_FAILURE` errors
4. Forms should have proper `action` attributes with the endpoint URLs
5. Test a form submission to verify the endpoint is reachable

## What If The Environment Variables Are Not Set?

If you don't set the environment variables in Cloudflare Pages:

- Forms will have `action={undefined}` 
- Form submissions will fail (submit to the current page URL)
- **But the page will render** (no blank page error)
- You'll just see a message like "Contact endpoint is not configured" (for ContactForm)

This is a graceful degradation - the site works but forms don't submit properly.

## Alternative Solutions Considered

1. **Use client-side JavaScript for all forms**: Would work but requires more code changes
2. **Set environment variables at worker runtime**: Not possible with current OpenNext setup
3. **Hardcode the URLs**: Not flexible for different environments (dev/staging/prod)

The `NEXT_PUBLIC_` prefix solution is the **recommended Next.js approach** for values that need to be available in the browser.
