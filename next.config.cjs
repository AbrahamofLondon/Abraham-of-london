// next.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Allow the app to build even if TS/ESLint complain
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // ✅ Route any `contentlayer/generated` import to a stub
      "contentlayer/generated": path.resolve(
        __dirname,
        "lib/stubs/contentlayer-generated.js"
      )
    };
    return config;
  }
};

export default nextConfig;