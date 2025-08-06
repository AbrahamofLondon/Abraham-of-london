/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['next-mdx-remote'],
  webpack(config) {
    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins: [],
            rehypePlugins: [],
          },
        },
      ],
    });
    config.resolve = {
      ...config.resolve,
      fullySpecified: false, // Ensures proper module resolution
    };
    return config;
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'abrahamoflondon.org',
        port: '',
        pathname: '**',
      },
    ],
  },
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    cacheHandler: 'filesystem',
  },
};

module.exports = nextConfig;
