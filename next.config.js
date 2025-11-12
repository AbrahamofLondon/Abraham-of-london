// next.config.mjs
/** @type {import("next").NextConfig} */
import fs from "node:fs";
import path from "node:path";

// Try to load the plugin; fall back to identity if missing
let withContentlayer = (cfg) => cfg;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  ({ withContentlayer } = await import("next-contentlayer"));
} catch { /* optional */ }

const generatedPath = path.resolve(process.cwd(), ".contentlayer/generated");
const hasGenerated = fs.existsSync(generatedPath);

// Only alias to a stub if we're in development AND the generated module is absent.
// In CI/Netlify we run `contentlayer build` before `next build`, so the real path exists.
const maybeAlias = (config) => {
  if (process.env.NODE_ENV !== "development") return config;
  if (hasGenerated) return config;

  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    "contentlayer/generated": path.resolve(
      process.cwd(),
      "lib/stubs/contentlayer-generated.js"
    ),
  };
  return config;
};

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, ctx) => {
    return maybeAlias(config);
  },
};

export default withContentlayer(nextConfig);