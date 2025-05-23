/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Add alias for src directory
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(__dirname, "src"),
    };

    // Ensure proper module resolution
    config.resolve.modules = [
      path.join(__dirname, "src"),
      "node_modules",
      ...(config.resolve.modules || []),
    ];

    return config;
  },
  // Add transpilePackages if needed
  transpilePackages: [],
  experimental: {
    // Enable module resolution features
    esmExternals: true,
  },
};

module.exports = nextConfig;
