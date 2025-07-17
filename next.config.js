// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Keep this if it's already there
  // Other Next.js configurations...

  webpack: (config, { isServer }) => {
    // This is the crucial part to fix the 'react' default export issue with MDX
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': 'preact/compat', // Use preact/compat for react-like behavior (often fixes this)
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
    };
    return config;
  },
};

module.exports = nextConfig;