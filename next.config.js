/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Remove exportPathMap (app router incompatible). Do not re-add.
  // If you need static export: output: 'export' (but only if you’ve built for that pattern).

  // Keep your redirects here (middleware doesn’t help during prerender).
  async redirects() {
    return [
      { source: '/strategy', destination: '/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
