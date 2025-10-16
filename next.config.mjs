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
};

let withAnalyzer = (cfg) => cfg;
if (isAnalyze) {
  try {
    const analyzer =
      require("@next/bundle-analyzer").default ?? require("@next/bundle-analyzer");
    withAnalyzer = analyzer({ enabled: true });
  } catch {
    // analyzer not installed — skip
  }
}

export default withAnalyzer(withMDX(nextConfig));
