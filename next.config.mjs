<<<<<<< HEAD
// next.config.mjs - COMPREHENSIVE RESTORATION
=======
// next.config.mjs - UPDATED WITH FIXED ALIASES & ASSET HARDENING
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

<<<<<<< HEAD
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
=======
// Try to load Contentlayer dynamically
let withContentlayer;
try {
  console.log('🔄 Attempting to load next-contentlayer...');
  const contentlayerModule = await import('next-contentlayer');
  withContentlayer = contentlayerModule.withContentlayer;
  console.log('✅ Next-Contentlayer loaded successfully');
} catch (error) {
  console.warn(⚠️ Next-contentlayer not available, running without it');
  withContentlayer = (config) => config;
}

/** @type {import('next').NextConfig} */
const baseConfig = {
  // =================== CORE CONFIGURATION ===================
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  
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
<<<<<<< HEAD
    deviceSizes: [320, 420, 768, 1024, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
    formats: ['image/webp', 'image/avif'],
=======
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 64, 96, 128],
    formats: ['image/webp'],
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
<<<<<<< HEAD
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
=======
  },
  
  // =================== WEBPACK CONFIG ===================
  webpack: (config, { isServer, dev, webpack }) => {
    // Handle SQL files - Prevent parse errors by using raw-loader
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
    config.module.rules.push({
      test: /\.sql$/,
      use: 'raw-loader',
    });
    
<<<<<<< HEAD
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
=======
    // Exclude scripts directory from processing to prevent build bloat
    config.module.rules.push({
      test: /scripts\/.*\.(ts|tsx|js|jsx)$/,
      use: 'ignore-loader',
    });

    // INSTITUTIONAL FIX: Ignore SQL files during the lazy-loading/module discovery phase
    // This stops Webpack from trying to parse .sql files in lib/server or root
    config.plugins.push(
      new webpack.IgnorePlugin({
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
        resourceRegExp: /\.sql$/,
      })
    );
    
<<<<<<< HEAD
    // 6. Windows-specific optimizations
=======
    // Windows-specific fixes for file watching
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
    if (process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
<<<<<<< HEAD
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
=======
      };
    }
    
    // Fix for Windows path resolution and Alias Hardening
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@': path.resolve(__dirname),
      },
    };
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
    
    return config;
  },
  
<<<<<<< HEAD
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
=======
  // =================== ERROR HANDLING ===================
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // =================== ENVIRONMENT VARIABLES ===================
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV || 'development',
  },
  
  // =================== OTHER SETTINGS ===================
  trailingSlash: false,
  compress: true,
};

// Apply Contentlayer wrapper if available
let finalConfig = baseConfig;
if (withContentlayer) {
  try {
    finalConfig = withContentlayer(baseConfig);
  } catch (error) {
    console.error('❌ Failed to apply Contentlayer wrapper:', error.message);
    finalConfig = baseConfig;
>>>>>>> b942cc6bad8394ca91341ab394a4afcd7652e775
  }
}

export default finalConfig;