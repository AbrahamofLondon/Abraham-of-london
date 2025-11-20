// next.config.js
/** @type {import('next').NextConfig} */
const { withContentlayer } = require("next-contentlayer");

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },

  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  async redirects() {
    return [
      {
        source: '/blog',
        destination: '/content',
        permanent: true,
      },
      {
        source: '/books',
        destination: '/content', 
        permanent: true,
      },
      {
        source: '/articles',
        destination: '/content',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

// Check if contentlayer is available before using it
try {
  module.exports = withContentlayer(nextConfig);
} catch (error) {
  console.log('Contentlayer not available, using standard config');
  module.exports = nextConfig;
}