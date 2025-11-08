# UNHOLY CO. — BloodThirst Website (Next.js + Tailwind)

Premium gothic website for UNHOLY CO. built with Next.js App Router, Tailwind, Framer Motion, and Lucide.
Forms post to a Cloudflare Worker which logs to Airtable and triggers Mailjet emails.

## Quick start
```bash
npm i   # or pnpm i / yarn
cp .env.example .env.local
# Edit .env.local with your local endpoints
npm run dev
```

## Deploy on Cloudflare Pages

### ⚠️ IMPORTANT: Environment Variables Setup

**READ THIS FIRST**: [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md)

If you see a blank page with `ERR_HTTP_RESPONSE_CODE_FAILURE` after deployment, read [FIX_BLANK_PAGE.md](./FIX_BLANK_PAGE.md).

### Deployment Steps

1. **Push to GitHub** - Commit and push your code to your repository

2. **Create a Cloudflare Pages Project**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to Workers & Pages → Create application → Pages → Connect to Git
   - Select your repository

3. **Configure Build Settings**
   - Build command: `npm run cf:bundle`
   - Build output directory: `.open-next`
   - Root directory: (leave empty)

4. **Set Environment Variables** (CRITICAL!)
   - Go to Settings → Environment variables
   - Add these variables for **Production** environment:
     ```
     NEXT_PUBLIC_WORKER_ENDPOINT=https://your-domain.pages.dev/api/contact
     NEXT_PUBLIC_WORKER_SUBSCRIBE_ENDPOINT=https://your-domain.pages.dev/api/subscribe
     NEXT_PUBLIC_WORKER_ORDER_ENDPOINT=https://your-domain.pages.dev/api/order
     NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_public_key
     ```
   - **DO NOT set these in `wrangler.toml`** - they won't work there!
   - See [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md) for detailed instructions

5. **Deploy**
   - Save and deploy
   - Cloudflare will automatically build and deploy your site

### How It Works

The build uses `@opennextjs/cloudflare` which generates optimized output for Cloudflare Pages:
- `scripts/create-opennext-config.mjs` - Creates OpenNext configuration before build
- `scripts/cf-postbuild.mjs` - Creates `_routes.json` with correct exclusions for static assets
- Static assets (`/_next/*`, images) are served directly by Cloudflare's CDN
- Dynamic pages are handled by Cloudflare Workers with Node.js compatibility

## Worker

See `workers/submit.ts` for a TypeScript Worker example that validates payload, writes to Airtable, and sends a Mailjet email.

## Troubleshooting

- **Blank page after deployment?** → [FIX_BLANK_PAGE.md](./FIX_BLANK_PAGE.md)
- **Environment variables not working?** → [CLOUDFLARE_ENV_SETUP.md](./CLOUDFLARE_ENV_SETUP.md)
- **Forms not submitting?** → Check that environment variables are set in Cloudflare Pages Dashboard
