// next.config.js
/** @type {import('next').NextConfig} */
const { withContentlayer } = require("contentlayer2").nextContentlayer;

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

module.exports = withContentlayer(nextConfig);