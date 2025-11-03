import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import { createRequire } from "node:module";
import path from "node:path";
import { withContentlayer } from "next-contentlayer2";

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
  experimental: { optimizePackageImports: ["framer-motion"] },
  webpack(config, { dev }) {
    // Normalize loader definitions (defensive)
    config.module.rules = config.module.rules
      .map((rule) => {
        if (!rule || !rule.use) return rule;
        const arr = Array.isArray(rule.use) ? rule.use : [rule.use];
        const cleaned = arr
          .filter(Boolean)
          .map((u) => (typeof u === "string" ? { loader: u } : u))
          .filter((u) => u && typeof u.loader === "string");
        if (cleaned.length === 0) return dev ? null : rule;
        return { ...rule, use: cleaned };
      })
      .filter(Boolean);

    // Path aliases to satisfy "@/components/MdxComponents" and friends
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(process.cwd()),
      "@/components": path.resolve(process.cwd(), "components"),
      "@/lib": path.resolve(process.cwd(), "lib"),
      "@/styles": path.resolve(process.cwd(), "styles"),
      "@/config": path.resolve(process.cwd(), "config"),
      "contentlayer/generated": path.resolve(process.cwd(), ".contentlayer/generated"),
    };

    return config;
  },
};

let withAnalyzer = (cfg) => cfg;
if (isAnalyze) {
  try {
    const analyzer = require("@next/bundle-analyzer").default ?? require("@next/bundle-analyzer");
    withAnalyzer = analyzer({ enabled: true });
  } catch {}
}
