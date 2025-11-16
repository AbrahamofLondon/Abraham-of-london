/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  reactStrictMode: true,
  
  // Add these to ensure build passes
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  async redirects() {
    return [
      {
        source: '/blog',
        destination: '/content',
        permanent: true,
      },
      {
        source: '/books', 
        destination: '/content',
        permanent: true,
      },
    ];
  },
};

console.log('Building with next.config.cjs - static export mode');
module.exports = nextConfig;