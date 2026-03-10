import path from 'node:path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for OpenNext Cloudflare adapter
  images: {
    unoptimized: true, // 👈 serve from /public directly (no optimizer)
  },
  experimental: {
    typedRoutes: true,
    viewTransition: true,
  },
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@/public': path.join(process.cwd(), 'public'),
    }

    return config
  },
};

export default nextConfig;