/** @type {import('next').NextConfig} */
import withMDX from '@next/mdx';
import bundleAnalyzer from '@next/bundle-analyzer';
import remarkGfm from 'remark-gfm';
import rehypeStringify from 'rehype-stringify';

const mdxConfig = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeStringify],
    providerImportSource: '@mdx-js/react',
  },
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['abraham-of-london.netlify.app'],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

export default withBundleAnalyzer(mdxConfig(nextConfig));