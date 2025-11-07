/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  images: {
    unoptimized: true, // 👈 serve from /public directly (no optimizer)
  },
};

export default nextConfig;