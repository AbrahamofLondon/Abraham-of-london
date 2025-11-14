// next.config.cjs
const path = require("node:path");
const { fileURLToPath } = require("node:url");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "contentlayer/generated": path.resolve(
        __dirname,
        "lib/stubs/contentlayer-generated.js"
      ),
    };
    return config;
  },
};

module.exports = nextConfig;