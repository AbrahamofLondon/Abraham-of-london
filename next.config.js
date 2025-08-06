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
  // Enable TypeScript and ESLint for better error detection
  typescript: {
    ignoreBuildErrors: false, // Ensure build fails on TypeScript errors
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    ignoreDuringBuilds: false, // Ensure ESLint runs during build
  },
  // Enable build caching
  experimental: {
    cacheHandler: 'filesystem', // Use filesystem for build caching
    incrementalCacheHandlerPath: require.resolve('./cache-handler.js'), // Optional custom cache handler
  },
};

export default nextConfig;