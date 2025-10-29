// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  // NOTE: 'experimental' block removed entirely to eliminate warnings,
  // relying on Next.js 14.2.32 to use the stable Webpack compiler.
};

// Export the raw configuration, bypassing the Contentlayer integration
module.exports = nextConfig;
// or if using ESM: export default nextConfig;