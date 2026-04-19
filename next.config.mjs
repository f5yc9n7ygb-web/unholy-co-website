import path from 'node:path'
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for OpenNext Cloudflare adapter
  typedRoutes: true,
  images: {
    unoptimized: true, // 👈 serve from /public directly (no optimizer)
  },
  experimental: {
    viewTransition: true,
  },
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      '@/public': path.join(process.cwd(), 'public'),
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@/public': path.join(process.cwd(), 'public'),
    }

    return config
  },
  async headers() {
    return [
      // Aggressive caching for large immutable 3D/media assets
      {
        source: '/:path*.glb',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*.hdr',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*.webp',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://api.razorpay.com",
              // Allow outbound connections to PostHog (analytics) and Sentry (error tracking)
              // Sentry EU region uses *.ingest.de.sentry.io (multi-level subdomain, needs explicit rule)
              "connect-src 'self' https://*.posthog.com https://eu.i.posthog.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://api.razorpay.com https://www.facebook.com https://connect.facebook.net",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: "unholy-beverages-pvt-ltd",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
})
