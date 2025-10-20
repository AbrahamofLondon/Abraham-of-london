// next.config.mjs (ESM)
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const relax = process.env.CI_LAX === "1";
const isAnalyze = process.env.ANALYZE === "true";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [remarkGfm] },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  eslint: { ignoreDuringBuilds: relax },
  typescript: { ignoreBuildErrors: relax },

  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "abraham-of-london.netlify.app" },
      { protocol: "https", hostname: "abrahamoflondon.org" },
      { protocol: "https", hostname: "www.abrahamoflondon.org" },
    ],
  },

  experimental: {
    optimizePackageImports: ["framer-motion"],
  },

  webpack(config, { dev }) {
    // ---- SAFETY NET: remove/normalize any malformed loader entries ----
    config.module.rules = config.module.rules
      .map((rule) => {
        if (!rule || !rule.use) return rule;

        // Normalize rule.use into an array of { loader, options? }
        const asArray = Array.isArray(rule.use) ? rule.use : [rule.use];

        const cleaned = asArray
          .filter(Boolean) // drop undefined/false/null
          .map((u) => (typeof u === "string" ? { loader: u } : u))
          .filter((u) => u && typeof u.loader === "string"); // keep only valid loaders

        // If after cleaning nothing valid remains, drop the rule in dev (prevents Windows crash)
        if (cleaned.length === 0) return dev ? null : rule;

        return { ...rule, use: cleaned };
      })
      .filter(Boolean);

    return config;
  },
};

// Optional: bundle analyzer (safe in ESM)
let withAnalyzer = (cfg) => cfg;
if (isAnalyze) {
  try {
    const analyzer =
      require("@next/bundle-analyzer").default ??
      require("@next/bundle-analyzer");
    withAnalyzer = analyzer({ enabled: true });
  } catch {
    // analyzer not installed — ignore
  }
}

export default withAnalyzer(withMDX(nextConfig));
