// next.config.mjs - MUST use ES modules
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle Contentlayer2
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Ignore PDF generation warnings
    config.ignoreWarnings = [
      { module: /@react-pdf\/renderer/ },
      { module: /pdfkit/ },
      { module: /markdown-pdf/ },
    ];

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      'pdfkit',
      'pdf-lib',
      'markdown-pdf',
      '@react-pdf/renderer'
    ],
  },
  output: 'standalone',
};

export default nextConfig;