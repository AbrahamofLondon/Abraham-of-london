/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,               // Catch potential problems
  trailingSlash: false,               // Clean URLs: /blog/post vs /blog/post/
  output: 'standalone',               // Required for SSR-ready deploys (e.g., Vercel, Docker)
  images: {
    domains: ['yourdomain.com'],      // Replace with your actual domain or CDN (e.g., 'abrahamoflondon.org')
    formats: ['image/webp'],          // Optimize image performance
  }, // <--- THIS CLOSING BRACE IS CRITICAL
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