// next.config.js
// REMOVE: const { withContentlayer } = require('contentlayer/next');
// REMOVE: const withMDX = require('@next/mdx')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure this extension setup handles your MDX files directly (required after Contentlayer removal)
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
};

// Use the clean, unwrapped export
module.exports = nextConfig;