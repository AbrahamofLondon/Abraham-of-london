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
  // The 'compiler' block with 'reactRuntime: 'classic'' is removed for Next.js 14.x.
  // Next.js 14.x uses the automatic JSX runtime by default.
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
  // You might want to explicitly set distDir if Netlify config relies on it,
  // although it usually defaults to '.next'
  // distDir: '.next',
};

module.exports = nextConfig;