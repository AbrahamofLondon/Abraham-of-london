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

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Keep if you reference assets from the Netlify subdomain
    domains: ['abraham-of-london.netlify.app'],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  // IMPORTANT: no redirects() or middleware that rewrites hosts.
};

export default withBundleAnalyzer(mdxConfig(nextConfig));
