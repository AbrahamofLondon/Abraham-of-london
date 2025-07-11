/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,               // Catch potential problems
  trailingSlash: false,               // Clean URLs: /blog/post vs /blog/post/
  output: 'standalone',               // Required for SSR-ready deploys (e.g., Vercel, Docker)
  images: {
    domains: ['yourdomain.com'],      // Replace with your actual domain or CDN
    formats: ['image/webp'],          // Optimize image performance
  }, // Corrected: Added missing closing brace for 'images'

  eslint: {
    ignoreDuringBuilds: false,        // Set to true only if ESLint blocks build unnecessarily
  },
  typescript: {
    ignoreBuildErrors: false,         // Set to true **only temporarily** if TS errors block deploy
  },

  // Webpack configuration to handle 'fs' module for client-side
  webpack: (config, { isServer }) => {
    // Only provide a polyfill/mock for 'fs' on the client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, // Spread existing fallback if any
        fs: false, // Prevents 'fs' from being bundled on the client side
      };
    }
    return config;
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