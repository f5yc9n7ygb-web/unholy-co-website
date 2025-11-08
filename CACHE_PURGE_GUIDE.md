# Cache Purging Guide for Cloudflare Pages

## Issue: Stale JavaScript Chunks After Redeploy

When you redeploy your Next.js app on Cloudflare Pages, the HTML may be cached pointing to old JavaScript chunk names that no longer exist, causing blank pages or `ERR_HTTP_RESPONSE_CODE_FAILURE` errors.

## Solution: Purge Cloudflare Cache After Deployment

### Method 1: Automatic Cache Purge (Recommended)

Cloudflare Pages should automatically purge the cache on new deployments, but you can verify this is working correctly.

### Method 2: Manual Cache Purge via Dashboard

1. Go to https://dash.cloudflare.com/
2. Select your account → Click on your domain (e.g., `theunholy.co` or `unholy-co-website.pages.dev`)
3. Navigate to **Caching** → **Configuration**
4. Click **"Purge Everything"** to clear all cached assets
5. Confirm the purge

### Method 3: Selective Cache Purge

If you only want to clear specific assets:

1. Go to **Caching** → **Configuration**
2. Select **"Custom Purge"**
3. Enter the URLs or file patterns you want to purge:
   - `https://unholy-co-website.pages.dev/_next/static/*`
   - `https://unholy-co-website.pages.dev/*.html`

### Method 4: API-Based Cache Purge

For automated cache purging in CI/CD:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Best Practices

1. **After Every Deployment**: Purge the cache after deploying changes that affect JavaScript chunks or HTML
2. **Use Cache-Control Headers**: Ensure `_next/static/*` files have proper cache headers with hashed filenames
3. **Monitor Deployments**: Check that new deployments complete successfully before purging cache
4. **Test Before Purge**: Test the new deployment on the preview URL before purging production cache

## Verification

After purging cache:

1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser DevTools → Network tab
3. Verify that JavaScript chunks load successfully (200 status)
4. Confirm no 404 errors for `_next/static/*` files

## OpenNext + Cloudflare Pages Specific Notes

- The `.open-next/worker.js` handles routing for dynamic pages
- The `_routes.json` file determines which requests go to the worker vs static assets
- Static assets in `/_next/static/*` should be served directly from Cloudflare's CDN
- Cache purging affects both the HTML and the JavaScript bundles

## Troubleshooting

**Issue**: Cache still serves old chunks after purge
- **Solution**: Wait 5-10 minutes for the purge to propagate globally
- Try clearing your browser cache as well

**Issue**: Some users still see old version
- **Solution**: Purge cache on both production and preview environments
- Check if you have additional caching layers (e.g., another CDN, service worker)

**Issue**: API routes return 404 after deployment
- **Solution**: Verify the `_routes.json` includes `["/*"]` to route all requests through the worker
- Check that `worker.js` exists in the `.open-next` directory
