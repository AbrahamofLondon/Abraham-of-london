// next.config.mjs
import withMDX from '@next/mdx';
import bundleAnalyzer from '@next/bundle-analyzer';
import remarkGfm from 'remark-gfm';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const baseConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Only list remote hosts you actually load images from.
    // Remove this whole block if all images live in /public.
    remotePatterns: [
      { protocol: 'https', hostname: 'abraham-of-london.netlify.app' },
      // Examples — add only if you use them:
      // { protocol: 'https', hostname: 'images.unsplash.com' },
      // { protocol: 'https', hostname: 'pbs.twimg.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  // IMPORTANT: no redirects() or middleware that rewrites hosts.
};

export default withBundleAnalyzer(
  withMDX({
    extension: /\.mdx?$/,
    options: {
      remarkPlugins: [remarkGfm],
      // Do not add rehypeStringify here; Next/MDX handles rehype -> React.
      providerImportSource: '@mdx-js/react',
    },
  })(baseConfig)
);
