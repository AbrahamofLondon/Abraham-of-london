// next.config.cjs
const { withContentlayer } = require("contentlayer2").nextContentlayer;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,

  // DO NOT use `output: 'export'` – you have API routes + middleware.

  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },

  compress: true,
  poweredByHeader: false,

  eslint: {
    // CI still runs lint; builds won't be blocked by lint errors.
    ignoreDuringBuilds: true,
  },

  async redirects() {
    return [
      { source: "/blog", destination: "/content", permanent: true },
      { source: "/books", destination: "/content", permanent: true },
      { source: "/articles", destination: "/content", permanent: true },
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
    ].join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = withContentlayer(nextConfig);