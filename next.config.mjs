// next.config.mjs - ENTERPRISE PRODUCTION CONFIG (ES Module)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // =================== CORE CONFIGURATION ===================
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  
  // =================== IMAGE OPTIMIZATION ===================
  images: {
    deviceSizes: [320, 420, 768, 1024, 1200, 1440, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // =================== ADVANCED WEBPACK CONFIG ===================
  webpack: (config, { isServer, dev, webpack }) => {
    // ========== WINDOWS-SPECIFIC OPTIMIZATIONS ==========
    if (process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/.git/**',
          '**/.next/**',
          '**/node_modules/**',
          '**/.contentlayer/**',
          '**/public/**'
        ]
      };
      
      // Windows path resolution fixes
      config.resolve = {
        ...config.resolve,
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        alias: {
          ...config.resolve.alias,
          '@': path.resolve(__dirname),
        },
        fallback: {
          ...config.resolve.fallback,
          fs: false,
        }
      };
    }
    
    // ========== PERFORMANCE OPTIMIZATIONS ==========
    if (!isServer) {
      // Split vendor chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 20,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              return match ? `npm.${match[1].replace('@', '')}` : null;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name: 'shared',
            test: /[\\/]src[\\/]shared[\\/]/,
            priority: 10,
            enforce: true,
          },
        },
      };
    }
    
    // ========== ASSET HANDLING ==========
    config.module.rules.push(
      // PDF files
      {
        test: /\.(pdf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/chunks/[path][name].[contenthash][ext]'
        }
      },
      // Font files
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[name].[contenthash][ext]'
        }
      },
      // SVG optimization
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      }
    );
    
    // ========== SECURITY & MONITORING ==========
    if (!dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.BUILD_ID': JSON.stringify(process.env.BUILD_ID || Date.now()),
        })
      );
    }
    
    return config;
  },
  
  // =================== EXPERIMENTAL FEATURES ===================
  experimental: {
    // Performance
    workerThreads: true,
    cpus: process.env.NODE_ENV === 'production' ? 4 : 2,
    optimizeCss: true,
    scrollRestoration: true,
    externalDir: true,
    
    // Modern features
    turbo: {
      resolveAlias: {
        '@/*': ['./*'],
      },
    },
    
    // Memory management
    largePageDataBytes: 128 * 1000, // 128KB
  },
  
  // =================== PRODUCTION OPTIMIZATIONS ===================
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-test'],
    } : false,
  },
  
  // =================== SECURITY HEADERS ===================
  headers: async () => {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'Content-Security-Policy',
        value: process.env.NODE_ENV === 'production' 
          ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; media-src 'self'; object-src 'none'; frame-src 'self';"
          : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
      },
    ];
    
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  
  // =================== ENVIRONMENT CONFIG ===================
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV || 'development',
    CONTENTLAYER_ENABLED: 'true',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
  
  // =================== BUILD OPTIMIZATIONS ===================
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // =================== ERROR HANDLING ===================
  onDemandEntries: {
    maxInactiveAge: 25 * 1000, // 25 seconds
    pagesBufferLength: 5,
  },
  
  // =================== DEVELOPMENT ONLY ===================
  typescript: {
    ignoreBuildErrors: process.env.IGNORE_TYPECHECK === 'true',
  },
  
  eslint: {
    ignoreDuringBuilds: process.env.IGNORE_LINT === 'true',
  },
  
  // =================== STATIC GENERATION ===================
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
};

// Export without Contentlayer wrapper (it's causing issues)
export default nextConfig;