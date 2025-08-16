/** @type {import('next').NextConfig} */
import withMDX from "@next/mdx";
import bundleAnalyzer from "@next/bundle-analyzer";
import remarkGfm from "remark-gfm";
import rehypeStringify from "rehype-stringify";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withMdx = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeStringify],
    providerImportSource: "@mdx-js/react",
  },
});

const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ["image/avif", "image/webp"],
    domains: ["abraham-of-london.netlify.app"],
    // Removed unoptimized: true
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  // Remove CI workarounds once stable
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },
};

export default withBundleAnalyzer(withMdx(nextConfig));