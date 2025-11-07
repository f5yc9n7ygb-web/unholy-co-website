/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  output: 'standalone',
  images: {
    unoptimized: true, // 👈 serve from /public directly (no optimizer)
  },
};

export default nextConfig;