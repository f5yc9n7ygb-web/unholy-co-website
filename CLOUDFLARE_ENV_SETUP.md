# Cloudflare Pages Environment Variables Setup Guide

## 🚨 CRITICAL: Why Your Site Shows a Blank Page

Your deployment succeeds, but the site can still break because:

1. **The Problem**: Required environment variables were added only to `wrangler.toml`, or production URLs still pointed at a preview host
2. **Why It Fails**: The `[vars]` section defines **runtime bindings** for Cloudflare Workers, NOT build-time environment variables
3. **What Happens**: `NEXT_PUBLIC_*` variables must exist **during the build**, and `PUBLIC_SITE_URL` must match the hostname you want emails and server-generated links to use
4. **The Result**: The built code can miss required values or generate links for the wrong host

## ✅ The Correct Way: Cloudflare Pages Dashboard

Environment variables for Next.js apps on Cloudflare Pages **MUST** be set in the Cloudflare Dashboard, not in `wrangler.toml`.

### Step-by-Step Instructions

#### 1. Access Cloudflare Pages Dashboard

1. Go to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Log in to your account
3. Navigate to **Workers & Pages** in the left sidebar
4. Click on your project: **unholy-co-website**

#### 2. Navigate to Environment Variables

1. Click on the **Settings** tab
2. Scroll down to **Environment variables** section
3. Click **Add variables** button

#### 3. Add Required Variables

Add the following variables for **Production** environment:

**Variable Name** | **Value** | **Notes**
--- | --- | ---
`PUBLIC_SITE_URL` | `https://theunholy.co` | Canonical production hostname for emails and server-generated links
`NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_AbCdEf12345678` | Your Razorpay public key (test or live)

**Important Notes:**
- Click **"Add variable"** for each one
- Make sure to select **"Production"** environment (and optionally **"Preview"** for branch deployments)
- `PUBLIC_SITE_URL` should be your custom production domain
- Forms and checkout now use same-origin API routes (`/api/contact`, `/api/subscribe`, `/api/order`), so you do **not** need `NEXT_PUBLIC_WORKER_*` endpoint variables anymore
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is PUBLIC and visible in browser source code; never put secrets in `NEXT_PUBLIC_*`
- For Preview deployments, set `PUBLIC_SITE_URL` to that preview hostname if you want confirmation emails and server-generated links to stay on preview

#### 4. Save and Deploy

1. Click **"Save"** at the bottom of the page
2. Environment variables will be applied on the **next deployment**
3. Trigger a new deployment by either:
   - **Option A**: Go to **Deployments** tab → Click **"Retry deployment"** on the latest build
   - **Option B**: Push a new commit to your repository (automatic deployment)

#### 5. Verify the Fix

After the new deployment completes:

1. Visit your deployed site on the hostname you are verifying
2. The page should load normally (no blank page)
3. Open browser DevTools (F12) → Console
4. You should see NO `ERR_HTTP_RESPONSE_CODE_FAILURE` errors
5. Test a form submission to verify endpoints are working

**To verify variables are properly set:**

1. Right-click on any form → **View Page Source**
2. Search for `action=`
3. You should see same-origin form actions like `action="/api/contact"`, not a hardcoded preview hostname

## 📚 Understanding the Difference

### ❌ Wrong: `wrangler.toml` `[vars]` section

```toml
[vars]
NEXT_PUBLIC_WORKER_ENDPOINT = "https://..."  # ❌ Won't work for Next.js build-time variables
```

**Why it doesn't work:**
- `[vars]` are runtime bindings for Cloudflare Workers
- Available only AFTER deployment, not during build
- Next.js can't inline them into the client bundle
- Results in `undefined` values in browser code

### ✅ Correct: Cloudflare Pages Environment Variables (Dashboard)

**Why it works:**
- Variables are injected into the build environment
- Available to `next build` command as `process.env.NEXT_PUBLIC_*`
- Next.js inlines them into the JavaScript bundle at build time
- Browser code gets the actual values, not `undefined`

## 🔍 Build Process Explained

When Cloudflare Pages builds your site:

```bash
# 1. Environment variables from dashboard are loaded into process.env
export PUBLIC_SITE_URL="https://theunholy.co"
export NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxx"
# ... etc

# 2. npm run cf:bundle executes
npm run cf:bundle

# 3. Next.js build reads process.env and inlines NEXT_PUBLIC_* values
next build
# Output: JavaScript files with the correct public key and runtime code that
# uses same-origin API routes for form submissions

# 4. OpenNext packages the build for Cloudflare Workers
npx @opennextjs/cloudflare build

# 5. Deployment (variables are now baked into the code)
```

**Key Point**: By the time the worker runs, the variables are already compiled into the JavaScript code. They don't need to be in `wrangler.toml`.

## 🛠️ Local Development

For local development, create a `.env.local` file:

```bash
# .env.local (not committed to git)
PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_AbCdEf12345678
```

Then run:
```bash
npm run dev  # Variables from .env.local are automatically loaded
```

## 🔒 Security Note

**NEXT_PUBLIC_** prefix means these variables are **PUBLIC** and visible to anyone who visits your site. They're embedded in the JavaScript code that's sent to browsers.

**Safe to use NEXT_PUBLIC_ for:**
- ✅ API endpoints (they're public anyway)
- ✅ Public API keys (Razorpay public key, Google Maps API key, etc.)
- ✅ Feature flags
- ✅ Analytics IDs

**NEVER use NEXT_PUBLIC_ for:**
- ❌ Secret API keys
- ❌ Database credentials
- ❌ Private tokens
- ❌ Razorpay secret key

For server-side secrets, use Cloudflare Workers environment variables (different from Pages build variables) and access them via server actions or API routes.

## 📖 Additional Resources

- [Next.js Environment Variables Docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [OpenNext Cloudflare Env Vars Guide](https://opennext.js.org/cloudflare/howtos/env-vars)
- [Cloudflare Pages Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)

## ❓ Troubleshooting

### Q: I set the variables but still see blank page
**A**: Did you trigger a new deployment after setting the variables? They only take effect on new builds.

### Q: Variables show in dashboard but forms still don't work
**A**: Check the deployment logs for "Build environment variables" section. The variables should be listed there during build.

### Q: Can I use wrangler.toml for anything?
**A**: Yes! `wrangler.toml` is perfect for:
- Build output directory configuration
- Compatibility flags
- Observability settings
- Runtime bindings (KV, R2, D1, etc.) for server-side code

Just don't use it for `NEXT_PUBLIC_*` environment variables that need to be available at build time.

### Q: How do I know if it's working?
**A**: 
1. Check deployment logs for environment variables being set
2. View page source and search for your endpoint URLs in form actions
3. Test form submissions
4. No `ERR_HTTP_RESPONSE_CODE_FAILURE` errors in browser console

## 📝 Summary Checklist

- [ ] Remove `[vars]` section from `wrangler.toml` (already done in this PR)
- [ ] Go to Cloudflare Pages dashboard
- [ ] Navigate to Settings → Environment variables
- [ ] Add all four `NEXT_PUBLIC_*` variables for Production
- [ ] Save changes
- [ ] Trigger new deployment (retry or new commit)
- [ ] Wait for deployment to complete
- [ ] Visit site and verify it loads properly
- [ ] Test form submissions
- [ ] Celebrate! 🎉

---

**After following this guide, your site will load properly and all forms will work correctly.**
