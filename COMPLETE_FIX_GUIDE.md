# COMPLETE FIX: Blank Page Error on Cloudflare Pages

## TL;DR - What You Need to Do Right Now

1. **Merge this PR** ✅
2. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com/
3. **Navigate**: Workers & Pages → `unholy-co-website` → Settings → Environment variables
4. **Add these 4 variables for Production**:
   - `NEXT_PUBLIC_WORKER_ENDPOINT` = `https://unholy-co-website.pages.dev/api/contact`
   - `NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT` = `https://unholy-co-website.pages.dev/api/subscribe`
   - `NEXT_PUBLIC_WORKER_ORDER_ENDPOINT` = `https://unholy-co-website.pages.dev/api/order`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = `rzp_test_AbCdEf12345678` (or your actual key)
5. **Save and trigger new deployment** (Deployments → Retry deployment)
6. **Done!** Your site will load properly 🎉

---

## What Was Wrong

### The Problem
After deploying to Cloudflare Pages, your site showed a blank page with this error:
```
(failed)net::ERR_HTTP_RESPONSE_CODE_FAILURE
```

### The Root Cause
You followed the deployment logs which suggested adding environment variables to `wrangler.toml`:

```toml
# ❌ THIS DOESN'T WORK FOR NEXT.JS BUILD-TIME VARIABLES
[vars]
NEXT_PUBLIC_WORKER_ENDPOINT = "https://unholy-co-website.pages.dev/api/contact"
NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT = "https://unholy-co-website.pages.dev/api/subscribe"
NEXT_PUBLIC_WORKER_ORDER_ENDPOINT = "https://unholy-co-website.pages.dev/api/order"
NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_AbCdEf12345678"
```

**Why this failed:**
1. The `[vars]` section in `wrangler.toml` defines **runtime bindings** for Cloudflare Workers
2. These are only available AFTER deployment, not during the build process
3. Next.js `NEXT_PUBLIC_*` variables must be available **during the build** to be inlined into the JavaScript bundle
4. Since they weren't available during build, they became `undefined` in the browser code
5. Forms with `action="undefined"` caused the Cloudflare Worker to crash
6. This resulted in `ERR_HTTP_RESPONSE_CODE_FAILURE` instead of proper HTML

### Why the Deployment Logs Were Misleading

The deployment logs showed:
```
Build environment variables: 
  - NEXT_PUBLIC_WORKER_ENDPOINT: https://unholy-co-website.pages.dev/api/contact
  - NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT: https://unholy-co-website.pages.dev/api/subscribe
  - NEXT_PUBLIC_WORKER_ORDER_ENDPOINT: https://unholy-co-website.pages.dev/api/order
  - NEXT_PUBLIC_RAZORPAY_KEY_ID: rzp_test_AbCdEf12345678
```

This made it seem like the variables were being used during the build, but they were actually just being **read from wrangler.toml** and logged. They were NOT available to the Next.js build process as `process.env.NEXT_PUBLIC_*`.

---

## The Fix

### What This PR Does

1. **Removes the `[vars]` section from `wrangler.toml`**
   - Adds explanatory comments about where to actually set the variables
   
2. **Creates comprehensive documentation**:
   - [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md) - Detailed step-by-step guide
   - [FIX_BLANK_PAGE.md](./FIX_BLANK_PAGE.md) - Quick fix summary
   - Updates [README.md](./README.md) with proper deployment instructions

3. **Updates `.env.example`**
   - Clear documentation for each variable
   - Explains the difference between build-time and runtime variables
   - Shows local development setup

4. **Ensures graceful degradation**
   - All forms already have fallback values
   - Site won't crash if env vars are missing
   - Forms will just show helpful error messages

### Where to Actually Set Environment Variables

**✅ CORRECT**: Cloudflare Pages Dashboard

Go to: **Workers & Pages** → **your-project** → **Settings** → **Environment variables**

This makes variables available as `process.env.NEXT_PUBLIC_*` during the build process, which Next.js requires for build-time inlining.

**❌ WRONG**: `wrangler.toml` `[vars]` section

This is for runtime Worker bindings only, not for Next.js build-time variables.

---

## How Environment Variables Work in Next.js + Cloudflare

### Build-Time vs Runtime

```
┌─────────────────────────────────────────────────────────────┐
│ BUILD TIME (on Cloudflare's build servers)                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Cloudflare reads env vars from Dashboard                 │
│ 2. Sets them as process.env.NEXT_PUBLIC_* in build env     │
│ 3. Next.js reads process.env and inlines values into JS     │
│ 4. JavaScript bundle now has hardcoded endpoint URLs        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ RUNTIME (on Cloudflare Workers at the edge)                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Worker serves the pre-built JavaScript                   │
│ 2. Browser downloads JS with hardcoded values               │
│ 3. Forms work because endpoints are in the code             │
│ 4. No need for process.env at runtime                       │
└─────────────────────────────────────────────────────────────┘
```

### Why NEXT_PUBLIC_ prefix matters

- **With `NEXT_PUBLIC_` prefix**: Variable is inlined at build time, available in browser
- **Without `NEXT_PUBLIC_` prefix**: Variable is server-side only, NOT available in browser

For client-side forms, you MUST use the `NEXT_PUBLIC_` prefix.

---

## Verification Steps

After setting variables in Cloudflare Dashboard and redeploying:

### 1. Check the deployment logs
Look for:
```
Build environment variables: 
  - NEXT_PUBLIC_WORKER_ENDPOINT: https://...
```

If it says "(none found)", the variables aren't set correctly.

### 2. Visit your site
- Site should load (no blank page) ✅
- No `ERR_HTTP_RESPONSE_CODE_FAILURE` in browser console ✅

### 3. Verify form actions
Right-click on a form → View Page Source → Search for `<form`

You should see:
```html
<form action="https://unholy-co-website.pages.dev/api/contact" method="post">
```

NOT:
```html
<form action="undefined" method="post">
<form action="#" method="post">
```

### 4. Test form submission
Submit a form and verify it reaches your endpoint.

---

## Understanding the Error

### What `ERR_HTTP_RESPONSE_CODE_FAILURE` means

This error occurs when:
1. Browser makes a request to load a page
2. Server (Cloudflare Worker) crashes or returns invalid data
3. Browser can't parse the response as valid HTTP

In this case:
- Forms had `action="undefined"`
- Worker tried to process the request
- Crashed due to invalid form action
- Returned an error instead of HTML
- Browser showed blank page with this error

---

## Common Questions

### Q: Why not just hardcode the endpoints in the code?
**A:** You want different endpoints for different environments (local dev, staging, production). Environment variables make this flexible.

### Q: Can I test locally?
**A:** Yes! Create a `.env.local` file:
```bash
NEXT_PUBLIC_WORKER_ENDPOINT=http://localhost:8787/api/contact
NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT=http://localhost:8787/api/subscribe
NEXT_PUBLIC_WORKER_ORDER_ENDPOINT=http://localhost:8787/api/order
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_AbCdEf12345678
```

Then `npm run dev` will use these values.

### Q: Are these variables secure?
**A:** Variables with `NEXT_PUBLIC_` prefix are PUBLIC - they're visible in browser source code. This is fine for:
- ✅ API endpoints (they're public anyway)
- ✅ Public API keys (Razorpay public key)

NEVER use `NEXT_PUBLIC_` for:
- ❌ Secret API keys
- ❌ Database credentials
- ❌ Razorpay secret key

### Q: What about other environment variables (Airtable, Mailjet, etc.)?
**A:** Those are server-side only and should be set in your Cloudflare Worker environment (different from Pages build environment). They don't need the `NEXT_PUBLIC_` prefix.

---

## Summary

| Aspect | Wrong Approach | Correct Approach |
|--------|---------------|------------------|
| **Location** | `wrangler.toml` `[vars]` section | Cloudflare Pages Dashboard |
| **When Available** | Runtime only | Build time + Runtime |
| **Next.js Access** | ❌ Can't access during build | ✅ Available as process.env |
| **Result** | `undefined` in browser → crash | Inlined values → works! |

---

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [OpenNext Cloudflare Env Vars](https://opennext.js.org/cloudflare/howtos/env-vars)
- [Cloudflare Pages Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)

---

**You're almost there! Just set those 4 environment variables in the Cloudflare Dashboard and redeploy. Your site will work perfectly! 🎉**
