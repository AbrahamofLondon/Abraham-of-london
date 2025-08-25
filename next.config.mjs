import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

const relax = process.env.CI_LAX === "1";
const isAnalyze = process.env.ANALYZE === "true";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [remarkGfm] },
});

const baseConfig = {
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
    ],
  },
  // experimental: { optimizePackageImports: ["framer-motion"] }, // keep disabled
};

// Conditionally load analyzer only if requested (no hard crash if missing)
let withAnalyzer = (cfg) => cfg;
if (isAnalyze) {
  try {
    const { default: analyzer } = await import("@next/bundle-analyzer");
    withAnalyzer = analyzer({ enabled: true });
  } catch {
    // Analyzer not installed — skip without failing CI
  }
}

export default withAnalyzer(withMDX(baseConfig));