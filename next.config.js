// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js configurations go here
  // For example:
  // reactStrictMode: true,
  // swcMinify: true,

  // Add this webpack configuration
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    };
    return config;
  },
};

module.exports = nextConfig;