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
  // Use static export for Cloudflare Pages compatibility
  output: 'export',
  // Simplify build
  experimental: {
    optimizeCss: false,
  },
  // Exclude API worker files from build
  exclude: [
    'api/**',
    'routing-worker.js',
    'wrangler*.toml'
  ],
};

module.exports = nextConfig; 