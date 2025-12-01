// next.config.js - SIMPLE VERSION WITHOUT CONTENTLAYER WRAPPER
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  compress: true,
  poweredByHeader: false,

  typescript: {
    ignoreBuildErrors: true,
  },

  async redirects() {
    return [
      { source: '/blog', destination: '/content', permanent: true },
      { source: '/books', destination: '/content', permanent: true },
      { source: '/articles', destination: '/content', permanent: true },
      {
        source: '/books/the-architecture-of-human-purpose-landing',
        destination: '/books/the-architecture-of-human-purpose',
        permanent: true,
      },
      {
        source: '/canon/volume-i-foundations-of-purpose',
        destination: '/volume-i-foundations-of-purpose',
        permanent: true,
      },
    ];
  },

  async headers() {
    const csp = [
      "default-src 'self';",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: https://www.google-analytics.com;",
      "font-src 'self' https://fonts.gstatic.com;",
      "connect-src 'self' https://www.google-analytics.com;",
      "frame-ancestors 'none';",
      "base-uri 'self';",
      "form-action 'self';",
    ].join(' ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig