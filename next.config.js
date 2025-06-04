/* eslint-disable @typescript-eslint/no-var-requires */
const crypto = require('crypto');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export since we need server-side functionality
  distDir: 'dist',
  images: {
    domains: ['*'], // Allow images from all domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize build size
  webpack: (config, { dev, isServer }) => {
    // Only apply optimizations for client-side production builds
    if (!dev && !isServer) {
      // Split chunks more aggressively
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Framework chunk
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|@react-google-maps)[\\/]/,
            priority: 40,
            enforce: true,
            reuseExistingChunk: true
          },
          // Library chunk
          lib: {
            test(module) {
              return (
                module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier())
              );
            },
            name(module) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return 'lib-' + hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
            maxSize: 24 * 1024 * 1024 // 24MB max size
          },
          // Commons chunk
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20
          },
          // Shared chunk
          shared: {
            name(module, chunks) {
              const hash = crypto
                .createHash('sha1')
                .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                .digest('hex');
              return hash.substring(0, 8);
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
            maxSize: 24 * 1024 * 1024 // 24MB max size
          }
        }
      };

      // Enable terser for minification
      config.optimization.minimize = true;

      // Use deterministic chunk and module ids
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
    }
    return config;
  },
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  // Enable production compression
  compress: true,
  output: 'export',
  experimental: {
    optimizeCss: true,
    webpackBuildWorker: true
  },
};

module.exports = nextConfig; 