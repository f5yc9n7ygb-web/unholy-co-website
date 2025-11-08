# CRITICAL: Environment Variables Setup Required

## ⚠️ IMPORTANT: The site will load but forms won't work without environment variables

After deploying this fix, **you MUST set environment variables in Cloudflare Pages** for the forms to work properly.

## What Was Fixed

The previous deployment was showing a blank page with `ERR_HTTP_RESPONSE_CODE_FAILURE` because:

1. Form actions were using `process.env.NEXT_PUBLIC_WORKER_ENDPOINT` directly
2. When environment variables weren't set during build, this became `undefined`
3. The HTML had `action="undefined"` which caused the Cloudflare Worker to crash
4. This resulted in `ERR_HTTP_RESPONSE_CODE_FAILURE` instead of a proper HTTP response

**The fix:** All form actions now have fallback values using `|| "#"` so the page renders without crashing, even when environment variables are missing.

## Current Behavior After This Fix

### ✅ **Without environment variables set:**
- ✅ Site loads properly (no blank page)
- ✅ All pages render correctly
- ✅ No `ERR_HTTP_RESPONSE_CODE_FAILURE` error
- ❌ Forms submit to `#` (current page) instead of the worker endpoint
- ❌ Form submissions don't go anywhere (but gracefully fail)

### ✅ **With environment variables set:**
- ✅ Site loads properly
- ✅ All pages render correctly
- ✅ Forms submit to the correct worker endpoint
- ✅ Form submissions work as expected

## How to Set Environment Variables in Cloudflare Pages

### Step 1: Go to Cloudflare Pages Dashboard
1. Log in to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages**
3. Click on your project: `unholy-co-website`
4. Go to **Settings** → **Environment variables**

### Step 2: Add Required Variables

Click **"Add variable"** for each of the following:

#### For Production Environment:
```bash
NEXT_PUBLIC_WORKER_ENDPOINT=https://your-worker.workers.dev/submit
NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT=https://your-worker.workers.dev/submit
NEXT_PUBLIC_WORKER_ORDER_ENDPOINT=https://your-worker.workers.dev/order
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_public_key
```

#### For Preview Environment (optional):
You can set the same values for preview deployments or use different test endpoints.

### Step 3: Trigger a New Deployment

After adding the environment variables:

1. Go to **Deployments** tab
2. Click **"Retry deployment"** on the latest deployment
   
   OR
   
   Push a new commit to your repository (this will trigger automatic deployment)

### Step 4: Verify Forms Work

After the new deployment completes:

1. Visit your site
2. Scroll to the "Join the Unholy circle" section
3. Right-click on the form → **Inspect Element**
4. Look for the `<form>` tag
5. Verify it has `action="https://your-worker.workers.dev/submit"` (not `action="#"`)

## Important Notes

### These are PUBLIC variables
Environment variables prefixed with `NEXT_PUBLIC_` are **exposed in the browser** (visible in HTML source). This is intentional because they're needed for client-side forms.

**Only use for:**
- ✅ Public API endpoints
- ✅ Public API keys (like Razorpay's public key)

**DO NOT use for:**
- ❌ Secret keys
- ❌ API tokens
- ❌ Sensitive credentials

For server-side secrets (Airtable, Mailjet, Razorpay secret), set those in your worker environment, not in Cloudflare Pages.

### Why This is Different from Previous Fixes

The previous fix (PR #6) added the `NEXT_PUBLIC_` prefix to the environment variable names in the code, which was correct. However, that fix didn't address what happens when those variables aren't set in Cloudflare Pages during deployment.

This fix adds **graceful degradation**: the site loads even without environment variables, making it easier to debug and preventing the blank page error.

## Troubleshooting

### Q: I set the environment variables but forms still submit to `#`
**A:** You need to trigger a new deployment after setting environment variables. The variables are only used during the build process.

### Q: How do I know if my environment variables are set?
**A:** In the deployment log, look for "Build environment variables". If it says "(none found)", they're not set.

### Q: Can I test locally with these environment variables?
**A:** Yes! Create a `.env.local` file in your project root:
```bash
NEXT_PUBLIC_WORKER_ENDPOINT=http://localhost:8787/submit
NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT=http://localhost:8787/submit
NEXT_PUBLIC_WORKER_ORDER_ENDPOINT=http://localhost:8787/order
NEXT_PUBLIC_RAZORPAY_KEY_ID=test_key
```
Then run `npm run dev` and the forms will use these values.

### Q: What if I don't have a worker endpoint yet?
**A:** The site will work fine without environment variables set. Forms will submit to `#` (current page) which is harmless. Set up your worker endpoint first, then add the environment variables and redeploy.

## Summary

This fix ensures the site **always loads** regardless of environment variable configuration:

- **Before fix:** Missing env vars → blank page with `ERR_HTTP_RESPONSE_CODE_FAILURE`
- **After fix:** Missing env vars → site loads normally, forms just don't submit (graceful degradation)

But for full functionality, **you must set the environment variables in Cloudflare Pages**.
