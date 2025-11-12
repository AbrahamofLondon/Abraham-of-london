/** @type {import("next").NextConfig} */
const path = require("node:path");

// Try to load the plugin; fall back to identity if missing
const withContentlayer = (() => {
  try { return require("next-contentlayer"); }
  catch { return (cfg) => cfg; }
})();

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "contentlayer/generated": path.resolve(__dirname, "lib/stubs/contentlayer-generated.js"),
    };
    return config;
  },
};

module.exports = withContentlayer(nextConfig);
