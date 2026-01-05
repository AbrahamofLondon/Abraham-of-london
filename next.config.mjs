// next.config.mjs - FIXED VERSION
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load Contentlayer dynamically
let withContentlayer;
try {
  console.log('🔄 Attempting to load next-contentlayer...');
  const contentlayerModule = await import('next-contentlayer');
  withContentlayer = contentlayerModule.withContentlayer;
  console.log('✅ Next-Contentlayer loaded successfully');
} catch (error) {
  console.warn('⚠️ Next-contentlayer not available, running without it');
  withContentlayer = (config) => config;
}

/** @type {import('next').NextConfig} */
const baseConfig = {
  // =================== CORE CONFIGURATION ===================
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
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 64, 96, 128],
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // =================== WEBPACK CONFIG ===================
  webpack: (config, { isServer, dev, webpack }) => {
    // Handle SQL files - Prevent parse errors by using raw-loader
    config.module.rules.push({
      test: /\.sql$/,
      use: 'raw-loader',
    });
    
    // Exclude scripts directory from processing to prevent build bloat
    config.module.rules.push({
      test: /scripts\/.*\.(ts|tsx|js|jsx)$/,
      use: 'ignore-loader',
    });

    // INSTITUTIONAL FIX: Ignore SQL files during the lazy-loading/module discovery phase
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.sql$/,
      })
    );

    // NEW: Ignore binary files that cause Windows permission errors
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(pptx|xlsx|docx|pdf|zip|jpg|jpeg|png|gif|webp|svg|ico)$/,
        contextRegExp: /public[\\/]assets/,
      })
    );
    
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(pptx|xlsx|docx|pdf|zip)$/,
        contextRegExp: /public[\\/]downloads/,
      })
    );
    
    // Windows-specific fixes for file watching
    if (process.platform === 'win32') {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/public/downloads/**',
          '**/public/assets/**',  // NEW: Exclude all assets
          '**/*.pptx',
          '**/*.xlsx',
          '**/*.docx',
          '**/*.pdf',
          '**/*.zip',
          '**/*.jpg',
          '**/*.jpeg',
          '**/*.png',
          '**/*.gif',
          '**/*.webp',
          '**/*.svg',
          '**/*.ico',
        ],
      };
    } else {
      // Non-Windows systems
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/public/downloads/**',
        ],
      };
    }

    // NEW: Suppress contentlayer expression warning
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    
    // Fix for Windows path resolution and Alias Hardening
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@': path.resolve(__dirname),
      },
    };
    
    return config;
  },
  
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

  // NEW: Exclude downloads from output file tracing (optional optimization)
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'public/downloads/**',
        'public/assets/**',
      ],
    },
  },
};

// Apply Contentlayer wrapper if available
let finalConfig = baseConfig;
if (withContentlayer) {
  try {
    finalConfig = withContentlayer(baseConfig);
  } catch (error) {
    console.error('❌ Failed to apply Contentlayer wrapper:', error.message);
    finalConfig = baseConfig;
  }
}

export default finalConfig;