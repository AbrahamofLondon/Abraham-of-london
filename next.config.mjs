import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { withContentlayer } from 'next-contentlayer2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  webpack: (config, { isServer, dev, webpack }) => {
    // Fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
      crypto: false,
      os: false,
      util: false,
      url: false,
      assert: false,
      buffer: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
    };
    
    // CRITICAL: Ignore ioredis in client bundles
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^ioredis$/,
        })
      );
      
      // Also add to externals
      config.externals = config.externals || [];
      config.externals.push('ioredis');
    }
    
    // Ignore warnings
    config.ignoreWarnings = [
      { module: /@react-pdf\/renderer/ },
      { module: /pdfkit/ },
      { module: /markdown-pdf/ },
      { module: /puppeteer/ },
      { module: /canvas/ },
      { module: /sharp/ },
      { module: /better-sqlite3/ },
      { module: /node-gyp/ },
      { module: /ioredis/ },
      { file: /routers\/.*/ },
      { file: /node_modules\/.*/ },
    ];
    
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
        },
      };
    }
    
    // Windows-specific fixes
    if (process.platform === 'win32') {
      config.plugins = config.plugins || [];
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': __dirname,
      };
    }
    
    return config;
  },
  
  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      'pdfkit',
      'pdf-lib',
      'markdown-pdf',
      '@react-pdf/renderer',
      'puppeteer',
      'sharp',
      'bcrypt',
      'crypto',
      'jsonwebtoken',
      'ioredis', // Add ioredis here
      '@prisma/client',
      'prisma',
    ],
    
    optimizeCss: true,
    scrollRestoration: true,
    workerThreads: false,
    cpus: 4,
    
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  output: 'standalone',
  
  compress: true,
  
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      {
        source: '/admin/:path*',
        destination: '/admin/:path*',
      },
    ];
  },
  
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  env: {
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

// Wrap with ContentLayer
export default withContentlayer(nextConfig);