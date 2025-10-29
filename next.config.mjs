// next.config.js

// 1. IMPORT the correct, modern wrapper from the core 'contentlayer/next' package.
//    (Assuming you have run 'npm uninstall next-contentlayer' and 'npm install contentlayer')
const { withContentlayer } = require('contentlayer/next');


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  // NOTE: 'experimental' block removed entirely to eliminate warnings,
  // relying on Next.js 14.2.32 to use the stable Webpack compiler.
};

// 2. EXPORT the configuration wrapped by the Contentlayer function.
//    This integrates Contentlayer's build process seamlessly with Next.js 14.
module.exports = withContentlayer(nextConfig);