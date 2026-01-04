// next.config.mjs - UPDATED WITH FIXED ALIASES & ASSET HARDENING
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
  console.warn(⚠️ Next-contentlayer not available, running without it');
  withContentlayer = (config) => config;
}

/** @type {import('next').NextConfig} */
const baseConfig = {
  // =================== CORE CONFIGURATION ===================
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  
  // =================== IMAGE OPTIMIZATION ===================
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
    // This stops Webpack from trying to parse .sql files in lib/server or root
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.sql$/,
      })
    );
    
    // Windows-specific fixes for file watching
    if (process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
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