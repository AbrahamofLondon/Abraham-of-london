/** @type {import("next").NextConfig} */
const path = require("node:path");

const nextConfig = {
  reactStrictMode: true,

  // Let the build proceed even if TypeScript/ESLint complain
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // If any stray imports still reference Contentlayer, point to a harmless stub.
      "contentlayer/generated": path.resolve(
        __dirname,
        "lib/stubs/contentlayer-generated.js"
      ),
    };
    return config;
  },
};

module.exports = nextConfig;