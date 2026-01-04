// next.config.mjs - COMPREHENSIVE RESTORATION
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONTENTLAYER HANDLING ====================
let withContentlayer;
try {
  console.log('🔄 Loading next-contentlayer...');
  const contentlayerModule = await import('next-contentlayer');
  withContentlayer = contentlayerModule.withContentlayer;
  console.log('✅ Contentlayer loaded successfully');
} catch (error) {
  console.warn('⚠️ Contentlayer not available, proceeding without it');
  withContentlayer = (config) => config;
}

// ==================== INSTITUTIONAL CONFIGURATION ====================
/** @type {import('next').NextConfig} */
const institutionalConfig = {
  // ==================== CORE PERFORMANCE ====================
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  
  // ==================== SECURITY HEADERS ====================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      }
    ];
  },
  
  // ==================== IMAGE OPTIMIZATION ====================
  images: {
    deviceSizes: [320, 420, 768, 1024, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // ==================== REDIRECTS & REWRITES ====================
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/board/dashboard',
        permanent: true,
      },
      {
        source: '/wp-admin',
        destination: '/',
        permanent: true,
      },
      {
        source: '/wp-login.php',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // ==================== WEBPACK CONFIGURATION ====================
  webpack: (config, { isServer, dev, webpack }) => {
    // ==================== ASSET HANDLING ====================
    
    // 1. SQL File Handling - Institutional Requirement
    config.module.rules.push({
      test: /\.sql$/,
      use: 'raw-loader',
    });
    
    // 2. PDF File Handling
    config.module.rules.push({
      test: /\.pdf$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]'
      }
    });
    
    // 3. Email Template Support
    config.module.rules.push({
      test: /\.(md|txt)$/,
      use: 'raw-loader',
    });
    
    // 4. Exclude heavy scripts from client bundle
    config.module.rules.push({
      test: /scripts\/.*\.(ts|tsx|js|jsx)$/,
      include: path.resolve(__dirname, 'scripts'),
      use: 'ignore-loader',
    });
    
    // 5. Security: Ignore server-only utilities in client
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/server$/,
        contextRegExp: /\/lib\//,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.sql$/,
      })
    );
    
    // 6. Windows-specific optimizations
    if (process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
      
      // Fix for Windows path issues
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    // 7. Alias Configuration - CRITICAL FOR YOUR STRUCTURE
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@components': path.resolve(__dirname, 'components'),
      '@lib': path.resolve(__dirname, 'lib'),
      '@utils': path.resolve(__dirname, 'utils'),
      '@styles': path.resolve(__dirname, 'styles'),
      '@pages': path.resolve(__dirname, 'pages'),
      '@public': path.resolve(__dirname, 'public'),
      '@types': path.resolve(__dirname, 'types'),
      '@scripts': path.resolve(__dirname, 'scripts'),
      '@email': path.resolve(__dirname, 'email'),
      '@assets': path.resolve(__dirname, 'assets'),
    };
    
    // 8. Bundle Analyzer (Development only)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      );
    }
    
    return config;
  },
  
  // ==================== DEVELOPMENT SETTINGS ====================
  // Logging Configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // ==================== PRODUCTION SETTINGS ====================
  output: 'standalone',
  productionBrowserSourceMaps: false,
  
  // ==================== ERROR HANDLING ====================
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production' ? false : true,
  },
  
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production' ? false : true,
  },
  
  // ==================== ENVIRONMENT VARIABLES ====================
  env: {
    // Application Metadata
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_APP_NAME: 'Abraham of London',
    
    // Feature Flags
    NEXT_PUBLIC_ENABLE_EMAIL: process.env.NEXT_PUBLIC_ENABLE_EMAIL || 'false',
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || 'false',
    NEXT_PUBLIC_ENABLE_PDF_GENERATION: process.env.NEXT_PUBLIC_ENABLE_PDF_GENERATION || 'true',
    
    // Security Configuration
    NEXT_PUBLIC_SECURITY_LEVEL: 'institutional',
    
    // API Endpoints
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    NEXT_PUBLIC_API_VERSION: 'v1',
  },
  
  // ==================== EXPERIMENTAL FEATURES ====================
  experimental: {
    // Performance optimizations
    optimizeCss: true,
    scrollRestoration: true,
    workerThreads: false,
    cpus: 4,
    
    // Modern features
    serverActions: {
      bodySizeLimit: '2mb',
    },
    
    // Turbopack (development only)
    turbo: process.env.TURBOPACK === 'true' ? {} : undefined,
  },
  
  // ==================== COMPRESSION ====================
  compress: true,
  
  // ==================== CACHE SETTINGS ====================
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
};

// ==================== CONTENTLAYER INTEGRATION ====================
let finalConfig = institutionalConfig;
if (withContentlayer) {
  try {
    finalConfig = withContentlayer(institutionalConfig);
    console.log('✅ Contentlayer integrated successfully');
  } catch (error) {
    console.error('❌ Contentlayer integration failed:', error.message);
    finalConfig = institutionalConfig;
  }
}

export default finalConfig;