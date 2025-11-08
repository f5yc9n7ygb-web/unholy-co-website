# How to Verify The Fix Works

After merging this PR and setting the environment variables in Cloudflare Pages, follow these steps to verify the blank page error is resolved.

## Step 1: Set Environment Variables in Cloudflare Pages

1. Go to your Cloudflare Pages dashboard
2. Select your project: **unholy-co-website**
3. Navigate to: **Settings → Environment Variables**
4. Add the following variables:

### For Production Environment
```bash
NEXT_PUBLIC_WORKER_ENDPOINT=https://your-worker.workers.dev/submit
NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT=https://your-worker.workers.dev/submit
NEXT_PUBLIC_WORKER_ORDER_ENDPOINT=https://your-worker.workers.dev/order
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### For Preview Environment
(Use the same values or different endpoints if you have separate dev/staging workers)

5. Click **Save**
6. Trigger a new deployment (or wait for auto-deploy from the merge)

## Step 2: Wait for Deployment

After merging and setting environment variables:
- Cloudflare Pages will automatically deploy the new code
- Watch the deployment logs in the Cloudflare Pages dashboard
- The build should complete successfully (just like before)

## Step 3: Test the Website

### Basic Verification
1. **Visit your site URL**: `https://unholy-co-website.pages.dev` (or your custom domain)
2. **The homepage should load** - no blank page! ✅
3. **Open browser DevTools** (F12) → Console tab
4. **No `ERR_HTTP_RESPONSE_CODE_FAILURE` errors** should appear ✅

### Inspect the HTML Source
1. Right-click on the page → **View Page Source**
2. Search for "NEXT_PUBLIC_WORKER" in the source code
3. You should **NOT** see `NEXT_PUBLIC_WORKER_ENDPOINT` in the source
4. Instead, you should see the **actual URL** that was set in the environment variable
   ```html
   <!-- Example: -->
   <form action="https://your-worker.workers.dev/submit" method="post">
   ```

### Test Form Elements
1. **Find a subscription form** on the page (footer, homepage)
2. **Inspect the form element** (right-click → Inspect)
3. The `action` attribute should have a **valid URL**, not `undefined`
   ```html
   <!-- Good: -->
   <form action="https://your-worker.workers.dev/submit" method="post">
   
   <!-- Bad (before the fix): -->
   <form action method="post">
   ```

### Test Form Submission (Optional)
1. Navigate to the **Contact page**: `/contact`
2. Fill in the contact form
3. Click **Send incantation**
4. The form should either:
   - Submit successfully to your worker (if the worker is set up)
   - Show a network error (if the worker endpoint doesn't exist yet)
   - But **NOT** cause a blank page or `ERR_HTTP_RESPONSE_CODE_FAILURE`

## What Success Looks Like

### ✅ Before This Fix (The Problem)
```
Symptom: Blank white page
Console Error: (failed) net::ERR_HTTP_RESPONSE_CODE_FAILURE
Cause: Worker crashed due to undefined environment variables
```

### ✅ After This Fix (Expected)
```
Symptom: Website loads normally
Console: Clean, no HTTP response errors
Forms: Have proper action URLs with the endpoints you configured
```

## Troubleshooting

### If the page is still blank:

1. **Check environment variables are set correctly**
   - Go to Cloudflare Pages → Settings → Environment Variables
   - Verify all `NEXT_PUBLIC_*` variables are present
   - Make sure they're set for the right environment (Production/Preview)

2. **Trigger a new deployment**
   - Environment variable changes require a new build
   - Go to Deployments → Click "Retry deployment" on the latest one
   - OR make a small commit to trigger auto-deploy

3. **Check the build logs**
   - Open the deployment in Cloudflare Pages
   - View the build logs
   - Look for any errors during the build process

4. **Verify the build output**
   - The build should still show: `✓ Generating static pages (13/13)`
   - No errors during OpenNext bundling

### If forms don't submit:

This is **EXPECTED** if you haven't set up the actual Cloudflare Worker endpoints yet. The fix prevents the **blank page error**, but form submissions still need:

1. A Cloudflare Worker running at the endpoint URL
2. The worker configured to handle form submissions
3. Integration with Airtable/Mailjet (as per `.env.example`)

The important thing is: **The page loads and shows content**, even if forms don't submit yet.

## Next Steps After Verification

Once you confirm the site loads properly:

1. ✅ Site loads without blank page error
2. ⏭️ Set up Cloudflare Worker for form submissions (if not done already)
3. ⏭️ Test actual form submissions end-to-end
4. ⏭️ Set up custom domain (if desired)
5. ⏭️ Configure analytics and monitoring

## Questions?

If you still see the blank page after following all these steps, check:
- Are the environment variables actually set in Cloudflare Pages?
- Did you trigger a new deployment after setting them?
- Are you looking at the right deployment URL?

The fix is minimal and surgical - it only changes how environment variables are referenced. The deployment logs you shared show the build succeeds, so once the environment variables are set, the site should work perfectly.
