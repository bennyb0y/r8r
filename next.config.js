/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for Cloudflare Pages with static export
  images: {
    unoptimized: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Use static export for Cloudflare Pages compatibility (disable in dev)
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // Simplify build
  experimental: {
    optimizeCss: false,
  },
};

module.exports = nextConfig; 