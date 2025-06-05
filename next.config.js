/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simple configuration for static export
  images: {
    unoptimized: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Use static export for Cloudflare Pages
  output: 'export',
  // Disable optimizations that might cause issues
  experimental: {
    optimizeCss: false,
  },
};

module.exports = nextConfig; 