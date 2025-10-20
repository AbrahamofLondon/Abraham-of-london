/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // <-- REMOVE OR COMMENT OUT THIS LINE
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
