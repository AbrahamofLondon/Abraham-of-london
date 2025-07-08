const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
  // Add trailingSlash for better compatibility
  trailingSlash: true,
};

module.exports = nextConfig;