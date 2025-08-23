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
  poweredByHeader: false,              // optional
  productionBrowserSourceMaps: false,  // optional
  // eslint: { ignoreDuringBuilds: true }, // temporary escape hatch, if needed

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Only keep hosts you actually use; remove if all images are local.
      { protocol: 'https', hostname: 'abraham-of-london.netlify.app' },
    ],
  },

  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

export default withBundleAnalyzer(
  withMDX({
    extension: /\.mdx?$/,
    options: {
      remarkPlugins: [remarkGfm],
      providerImportSource: '@mdx-js/react',
    },
  })(baseConfig)
);
