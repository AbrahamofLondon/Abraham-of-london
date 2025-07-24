/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add aliases for react/jsx-runtime and react/jsx-dev-runtime
    // This explicitly tells Webpack where to find these modules.
    config.resolve.alias = {
      ...config.resolve.alias, // Keep existing aliases
      'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
    };

    // Important: return the modified config
    return config;
  },
  // If you have other Next.js specific configurations (e.g., images, experimental features),
  // make sure to include them here. If not, this can be the entire content.
};

module.exports = nextConfig;