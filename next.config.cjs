// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development practices
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Optimize images
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Webpack configuration
  webpack: (config) => {
    // Aliases for cleaner imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    
    return config;
  },
};

module.exports = nextConfig;