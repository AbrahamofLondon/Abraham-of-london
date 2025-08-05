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
  // REMOVED: ignoreBuildErrors: true,
  // REMOVED: ignoreDuringBuilds: true,
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
};

export default nextConfig;