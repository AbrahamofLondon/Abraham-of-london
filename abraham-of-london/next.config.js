/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,               // Catch potential problems
  trailingSlash: false,               // Clean URLs: /blog/post vs /blog/post/
  output: 'standalone',               // Required for SSR-ready deploys (e.g., Vercel, Docker)
  images: {
    domains: ['yourdomain.com'],      // Replace with your actual domain or CDN
    formats: ['image/webp'],          // Optimize image performance
  }, // <-- THIS IS THE MISSING CLOSING BRACE!
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
  // If you see warnings about 'experimental.serverActions' or 'swcMinify' in Netlify logs,
  // ensure they are NOT present in this file, or are configured correctly as objects.
};

module.exports = nextConfig;