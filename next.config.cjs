/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization configuration
  images: {
    // Allow your domain for external images
    domains: ['abrahamoflondon.org', 'abraham-of-london.netlify.app'],
    
    // Image formats to support
    formats: ['image/webp', 'image/avif'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Disable image optimization for static export if needed
    // unoptimized: true, // Uncomment if deploying to static hosting
  },
  
  // Trailing slash for compatibility with static hosting
  trailingSlash: true,
  
  // Asset prefix for CDN (if using one)
  // assetPrefix: 'https://your-cdn.com',
  
  // Experimental features
  experimental: {
    // Enable modern bundling
    esmExternals: true,
  },
  
  // Webpack configuration for handling different file types
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    
    return config;
  },
  
  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/assets/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig