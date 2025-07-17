// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Aliases for React and ReactDOM to Preact/compat for compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
      'react-dom/client': 'preact/compat', // Keep this specific alias, it's likely still needed
    };
    return config;
  },
};

module.exports = nextConfig;