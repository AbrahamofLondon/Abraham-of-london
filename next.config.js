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
    domains: ['abrahamoflondon.org'],
    formats: ['image/webp', 'image/avif'],
  },
  swcMinify: true,
};

module.exports = nextConfig;