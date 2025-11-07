# UNHOLY CO. — BloodThirst Website (Next.js + Tailwind)

Premium gothic website for UNHOLY CO. built with Next.js App Router, Tailwind, Framer Motion, and Lucide.
Forms post to a Cloudflare Worker which logs to Airtable and triggers Mailjet emails.

## Quick start
```bash
pnpm i   # or npm i / yarn
cp .env.example .env.local
npm run dev
```

## Deploy on Cloudflare Pages
1. Push to GitHub.
2. Create a new Pages project from the repo.
3. Build command: `npm run cf:bundle`  |  Output dir: `.open-next`
4. Set env vars from `.env.example` in Pages settings.
5. Add a Worker route `/api/submit` or use the external Worker endpoint in `WORKER_ENDPOINT`.

**Note**: The build uses `@opennextjs/cloudflare` which generates optimized output for Cloudflare Pages. The `scripts/cf-postbuild.mjs` creates the `_routes.json` file with correct exclusions for static assets (`/_next/static/*`). This ensures JS, CSS, and images are served directly by Cloudflare's CDN, not routed through the worker.

## Worker
See `workers/submit.ts` for a TypeScript Worker example that validates payload, writes to Airtable, and sends a Mailjet email.
