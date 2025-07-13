// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  images: {
    domains: ['abrahamoflondon.org'],
    formats: ['image/webp'],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ['@mdx-js/react', 'next-mdx-remote'],
  // --- ADD THIS NEW SECTION ---
  compiler: {
    reactRuntime: 'classic', // This is the crucial line for this fix
  },
  // -----------------------------
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;