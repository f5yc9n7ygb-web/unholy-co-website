# 🚨 CRITICAL FIX: Blank Page Error (ERR_HTTP_RESPONSE_CODE_FAILURE)

## What Was Wrong

You added environment variables to `wrangler.toml` in the `[vars]` section, but that doesn't work for Next.js build-time variables!

```toml
# ❌ THIS DOESN'T WORK FOR NEXT_PUBLIC_* VARIABLES
[vars]
NEXT_PUBLIC_WORKER_ENDPOINT = "https://..."
```

**Why it failed:**
- `[vars]` in wrangler.toml are **runtime bindings** (available after deployment)
- `NEXT_PUBLIC_*` variables need to be available **during build** (before deployment)
- Next.js couldn't find the variables → they became `undefined` → site crashed → blank page

## ✅ The Fix

**Environment variables MUST be set in Cloudflare Pages Dashboard, not wrangler.toml!**

### Quick Fix Steps:

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com/
2. **Navigate to**: Workers & Pages → `unholy-co-website` → Settings → Environment variables
3. **Add these variables for Production**:
   ```
   NEXT_PUBLIC_WORKER_ENDPOINT = https://unholy-co-website.pages.dev/api/contact
   NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT = https://unholy-co-website.pages.dev/api/subscribe
   NEXT_PUBLIC_WORKER_ORDER_ENDPOINT = https://unholy-co-website.pages.dev/api/order
   NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_test_AbCdEf12345678
   ```
4. **Save** and **trigger a new deployment** (Deployments → Retry deployment)
5. **Done!** Your site will now load properly 🎉

### Detailed Instructions

See [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md) for complete step-by-step instructions with screenshots and explanations.

## What Changed in This PR

1. ✅ Removed `[vars]` section from `wrangler.toml` (doesn't work for build-time variables)
2. ✅ Added clear comments explaining where to set environment variables
3. ✅ Created comprehensive guide: [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md)
4. ✅ Updated `.env.example` with proper documentation
5. ✅ All forms already have fallback values to prevent crashes

## Why This Works

**Build Process Flow:**
```
1. You set variables in Cloudflare Pages Dashboard ✅
   ↓
2. Cloudflare injects them into build environment
   ↓
3. Next.js reads process.env.NEXT_PUBLIC_* during build
   ↓
4. Variables are baked into the JavaScript code
   ↓
5. Deployed site has the values hardcoded (no runtime lookup needed)
```

## Verification

After setting variables in dashboard and redeploying:

✅ Site loads (no blank page)  
✅ No `ERR_HTTP_RESPONSE_CODE_FAILURE` in console  
✅ Forms have proper action URLs (view page source to check)  
✅ Form submissions work  

## Need Help?

Read [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md) - it explains:
- Why wrangler.toml vars don't work
- How Cloudflare Pages environment variables work
- Step-by-step setup instructions
- Common troubleshooting issues
- Security best practices

---

**TL;DR**: Merge this PR, then set environment variables in Cloudflare Pages Dashboard (not wrangler.toml), then redeploy. Your site will work!
