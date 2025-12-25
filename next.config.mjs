// next.config.mjs
import path from "path";
import { fileURLToPath } from "url";
import { withContentlayer } from "next-contentlayer2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isNetlify = process.env.NETLIFY === "true";
const isCI = process.env.CI === "true" || isNetlify;

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  trailingSlash: false,
  poweredByHeader: false,
  compress: true,

  images: {
    unoptimized: false,
    dangerouslyAllowSVG: true,
    // Optional: lock down image sources if you ever load remote images
    // remotePatterns: [{ protocol: "https", hostname: "www.abrahamoflondon.org" }],
  },

  /**
 * ENTERPRISE BUILD SIGNAL:
 * - Keep TS errors ON in CI by default.
 * - If you absolutely need an emergency bypass on Netlify:
 *   set NETLIFY_TS_IGNORE=true explicitly.
 */
typescript: {
  ignoreBuildErrors: isNetlify && process.env.NETLIFY_TS_IGNORE === "true",
},

/**
 * ESLint: never "always true".
 * If you want to skip lint on Netlify sometimes, make it explicit.
 */
eslint: {
  dirs: ["pages", "components", "lib", "types"],
  ignoreDuringBuilds:
    isNetlify && process.env.NETLIFY_ESLINT_IGNORE === "true",
},

  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-R2Y3YMY8F8",
  },

  experimental: {
    esmExternals: false,
  },

  pageExtensions: ["tsx", "ts", "jsx", "js", "mdx", "md"],

  webpack: (config, { dev, isServer }) => {
    /**
     * Dev cache:
     * - Don't fully disable unless you're chasing a cache bug.
     * - Keep it enabled for speed; optionally version it.
     */
    if (dev && process.env.NEXT_DEV_DISABLE_CACHE === "true") {
      config.cache = false;
    }

    // Path alias
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    // SVG via SVGR
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    // Browser bundles: do not polyfill node built-ins
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
      };
    }

    /**
     * Optional: reduce cache weirdness in CI by creating a stable cache name.
     * (Useful when multiple deployments share caches)
     */
    if (config.cache && typeof config.cache === "object" && isCI) {
      config.cache = {
        ...config.cache,
        name: `webpack-cache-${process.env.NODE_ENV || "prod"}`,
      };
    }

    return config;
  },
};

export default withContentlayer(nextConfig);