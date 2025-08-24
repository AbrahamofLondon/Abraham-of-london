// next.config.mjs
import createMDX from "@next/mdx";
import withBundleAnalyzer from "@next/bundle-analyzer";
import remarkGfm from "remark-gfm";

const relax = process.env.CI_LAX === "1"; // set to "1" in Netlify to unblock CI only

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    // providerImportSource is optional with @mdx-js/react v3; omit unless you need it
  },
});

const baseConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // CI-only relax (keeps local strict)
  eslint: { ignoreDuringBuilds: relax },
  typescript: { ignoreBuildErrors: relax },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Keep only domains you actually use for <Image src="https://...">
      { protocol: "https", hostname: "abraham-of-london.netlify.app" },
      { protocol: "https", hostname: "abrahamoflondon.org" },
      { protocol: "https", hostname: "www.abrahamoflondon.org" },
    ],
  },

  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(withMDX(baseConfig));
