const { withContentlayer } = require('next-contentlayer2');

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.abrahamoflondon.org',
      },
      {
        protocol: 'https',
        hostname: '**.netlify.app',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  webpack: (config, { isServer }) => {
    // Fix for MDX component resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': `${process.cwd()}/components`,
      '@/components/mdx': `${process.cwd()}/components/mdx`,
      '@/components/print': `${process.cwd()}/components/print`,
      '@/lib': `${process.cwd()}/lib`,
      '@/styles': `${process.cwd()}/styles`,
    };

    // Handle MDX files properly
    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins: [],
          },
        },
      ],
    });

    return config;
  },
};

module.exports = withContentlayer(nextConfig);