// next.config.mjs
import createMDX from '@next/mdx';
import bundleAnalyzer from '@next/bundle-analyzer';
import remarkGfm from 'remark-gfm';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    providerImportSource: '@mdx-js/react',
  },
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['abraham-of-london.netlify.app'],
  },
  // ← no modularizeImports here
  typescript: { ignoreBuildErrors: process.env.NEXT_IGNORE_TYPES === 'true' },
  eslint: { ignoreDuringBuilds: process.env.NEXT_IGNORE_ESLINT === 'true' },
};

export default withBundleAnalyzer(withMDX(nextConfig));
