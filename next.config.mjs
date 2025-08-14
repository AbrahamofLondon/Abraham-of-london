// next.config.mjs
import createMDX from '@next/mdx';
import bundleAnalyzer from '@next/bundle-analyzer';
import remarkGfm from 'remark-gfm';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    // No rehypeStringify — MDX outputs JSX
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
    // Either domains OR remotePatterns is fine — keep this if you load from Netlify
    domains: ['abraham-of-london.netlify.app'],
    // remotePatterns: [{ protocol: 'https', hostname: 'abraham-of-london.netlify.app' }],
  },
  modularizeImports: {
    'framer-motion': { transform: 'framer-motion/{{member}}' },
  },
  // Optional: only if you want to skip checks in CI
  typescript: { ignoreBuildErrors: process.env.NEXT_IGNORE_TYPES === 'true' },
  eslint: { ignoreDuringBuilds: process.env.NEXT_IGNORE_ESLINT === 'true' },
};

export default withBundleAnalyzer(withMDX(nextConfig));
