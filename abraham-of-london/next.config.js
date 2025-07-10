/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,               // Catch potential problems
  swcMinify: true,                     // Enable fast compiler-based minification
  trailingSlash: false,               // Clean URLs: /blog/post vs /blog/post/
  output: 'standalone',               // Required for SSR-ready deploys (e.g., Vercel, Docker)
  images: {
    domains: ['yourdomain.com'],      // Replace with your actual domain or CDN
    formats: ['image/webp'],          // Optimize image performance
  },
  experimental: {
    serverActions: true,              // If using new App Router features
  },
  eslint: {
    ignoreDuringBuilds: false,        // Set to true only if ESLint blocks build unnecessarily
  },
  typescript: {
    ignoreBuildErrors: false,         // Set to true **only temporarily** if TS errors block deploy
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
