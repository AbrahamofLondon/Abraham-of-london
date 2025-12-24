// next.config.mjs
import path from "path";
import { fileURLToPath } from "url";
import { withContentlayer } from "next-contentlayer2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isNetlify = process.env.NETLIFY === "true";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  /**
   * ✅ IMPORTANT:
   * Do NOT use output: "export" if you rely on:
   * - pages/api
   * - preview mode
   * - middleware
   */
  // output: "export",

  trailingSlash: false,
  poweredByHeader: false,
  compress: true,

  images: {
    // Keep Next image optimization ON for real Next runtime.
    // If you ever must disable, do it per environment—not globally.
    unoptimized: false,
    dangerouslyAllowSVG: true,
  },

  typescript: {
    // Don’t hide problems locally
    ignoreBuildErrors: false,
  },

  eslint: {
    // Don’t hide problems locally
    ignoreDuringBuilds: false,
    dirs: ["pages", "components", "lib", "types"],
  },

  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-R2Y3YMY8F8",
  },

  experimental: {
    // keep it boring = stable
    esmExternals: false,
  },

  pageExtensions: ["tsx", "ts", "jsx", "js", "mdx", "md"],

  webpack: (config, { dev }) => {
    // ✅ Apply the cache logic for development
    if (dev) {
      config.cache = false;
    }

    // ✅ Maintain your existing aliases
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    // ✅ Maintain your existing SVGR rules
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default withContentlayer(nextConfig);