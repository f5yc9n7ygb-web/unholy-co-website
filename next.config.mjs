import path from 'node:path'
import { withSentryConfig } from '@sentry/nextjs'

const isDev = process.env.NODE_ENV !== 'production'

const csp = [
  "default-src 'self'",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://checkout.razorpay.com",
    "https://connect.facebook.net",
  ].filter(Boolean).join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.facebook.com https://*.razorpay.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://api.razorpay.com",
  [
    "connect-src",
    "'self'",
    isDev ? "http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*" : "",
    "https://*.posthog.com",
    "https://eu.i.posthog.com",
    "https://*.sentry.io",
    "https://*.ingest.sentry.io",
    "https://*.ingest.de.sentry.io",
    "https://api.razorpay.com",
    "https://checkout.razorpay.com",
    "https://lumberjack.razorpay.com",
    "https://www.facebook.com",
    "https://connect.facebook.net",
  ].filter(Boolean).join(" "),
  "upgrade-insecure-requests",
].join("; ")

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for OpenNext Cloudflare adapter
  typedRoutes: true,
  // Keeps the floating local dev badge out of visual QA screenshots.
  devIndicators: false,
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
            value: csp,
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
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
})
