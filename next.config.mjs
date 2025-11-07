/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for OpenNext Cloudflare adapter
  experimental: { typedRoutes: true },
  images: {
    unoptimized: true, // 👈 serve from /public directly (no optimizer)
  },
};

export default nextConfig;