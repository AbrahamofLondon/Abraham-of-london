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
    // OLD: domains: ['abrahamoflondon.org'], // REMOVE THIS DEPRECATED LINE
    // NEW: Use remotePatterns for external images if you have any
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'abrahamoflondon.org', // This hostname must match the domain of your external images
        port: '',
        pathname: '**', // Allow any path on this hostname
      },
    ],
    // For local images (from /public), no configuration is typically needed here.
    // Next.js handles them automatically.
    // If you plan to optimize local images, the `sharp` package is recommended (as the warning mentioned).
    // formats: ['image/webp', 'image/avif'], // This can stay if you want these formats for optimization
  },
  swcMinify: true,
};

module.exports = nextConfig;