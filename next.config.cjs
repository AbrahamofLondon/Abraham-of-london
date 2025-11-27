const { withContentlayer } = require("contentlayer2").nextContentlayer;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,

  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },

  compress: true,
  poweredByHeader: false,

  eslint: {
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
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = withContentlayer(nextConfig);