// next.config.mjs
import createMDX from "@next/mdx";
import withBundleAnalyzer from "@next/bundle-analyzer";
import remarkGfm from "remark-gfm";

const relax = process.env.CI_LAX === "1";

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
  // ❌ remove optimizePackageImports (it rewrites to unsupported deep imports)
  // experimental: { optimizePackageImports: ["framer-motion"] },
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  withMDX(baseConfig)
);
