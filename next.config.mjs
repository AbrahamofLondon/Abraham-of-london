// next.config.mjs
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const relax = process.env.CI_LAX === "1";
const isAnalyze = process.env.ANALYZE === "true";

// MDX support
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [remarkGfm] },
});

const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  eslint: { ignoreDuringBuilds: relax },
  typescript: { ignoreBuildErrors: relax },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "abraham-of-london.netlify.app" },
      { protocol: "https", hostname: "abrahamoflondon.org" },
      { protocol: "https", hostname: "www.abrahamoflondon.org" },
      // add more CDNs/domains here if you load covers remotely
    ],
  },
  // experimental: { optimizePackageImports: ["framer-motion"] }, // keep disabled if you prefer
};

// Optional bundle analyzer (only when ANALYZE=true and package is present)
let withAnalyzer = (cfg) => cfg;
if (isAnalyze) {
  try {
    const analyzer = require("@next/bundle-analyzer").default
      ?? require("@next/bundle-analyzer");
    withAnalyzer = analyzer({ enabled: true });
  } catch {
    // analyzer not installed — skip silently
  }
}

export default withAnalyzer(withMDX(nextConfig));
