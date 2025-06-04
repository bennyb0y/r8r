import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during production builds
    ignoreBuildErrors: true,
  },
  // Add trailing slashes to ensure proper static file handling
  trailingSlash: true,
  // Optimize for static generation
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['@react-google-maps/api'],
  },
  // Configure webpack for better chunk handling
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      // Configure chunk loading
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
      // Ensure static files are served correctly
      config.output = {
        ...config.output,
        filename: 'static/chunks/[name].[contenthash].js',
        chunkFilename: 'static/chunks/[name].[contenthash].js',
        assetModuleFilename: 'static/media/[name].[contenthash][ext]',
      };
    }
    return config;
  },
  // Configure static file serving
  distDir: '.next',
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
