/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // REMOVE OR COMMENT OUT THIS LINE IF DEPLOYING TO NETLIFY/VERCEL
  // output: 'standalone', // <-- This should likely be removed for Netlify/Vercel
  images: {
    domains: ['abrahamoflondon.org'], // <--- UPDATE THIS TO YOUR DOMAIN(S)
    formats: ['image/webp'],
  }, // <--- ADD THIS MISSING CLOSING BRACE!
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
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