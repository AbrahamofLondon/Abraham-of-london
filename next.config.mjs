/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  // NOTE: 'experimental' block removed entirely to eliminate warnings,
  // relying on Next.js 14.2.32 to use the stable Webpack compiler.
};

export default nextConfig;