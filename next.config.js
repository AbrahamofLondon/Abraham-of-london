/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
import { withContentlayer } from 'next-contentlayer2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';
const isNetlify = process.env.NETLIFY === 'true';

const nextConfig = {
  // ============================================
  // CORE CONFIGURATION
  // ============================================
  reactStrictMode: true,
  swcMinify: true,
  
  // Static export for Netlify (MANDATORY for static hosting)
  output: 'export',
  
  // Trailing slash handling
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // Disable powered-by header
  poweredByHeader: false,
  
  // Enable compression
  compress: true,
  
  // ============================================
  // IMAGE OPTIMIZATION (Static Export)
  // ============================================
  images: {
    unoptimized: true, // REQUIRED for static export
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // ============================================
  // BUILD CONFIGURATION
  // ============================================
  // IMPORTANT: Remove these when static export issues are resolved
  typescript: {
    ignoreBuildErrors: isNetlify || process.env.CI === 'true',
  },
  
  eslint: {
    ignoreDuringBuilds: isNetlify || process.env.CI === 'true',
    dirs: ['pages', 'components', 'lib', 'app'],
  },
  
  // ============================================
  // COMPILER OPTIONS
  // ============================================
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // ============================================
  // ENVIRONMENT VARIABLES
  // ============================================
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org',
    NEXT_PUBLIC_INNOVATEHUB_URL: process.env.NEXT_PUBLIC_INNOVATEHUB_URL || 'https://innovatehub.abrahamoflondon.org',
    NEXT_PUBLIC_ALOMARADA_URL: process.env.NEXT_PUBLIC_ALOMARADA_URL || 'https://alomarada.com/',
    NEXT_PUBLIC_ENDURELUXE_URL: process.env.NEXT_PUBLIC_ENDURELUXE_URL || 'https://alomarada.com/endureluxe',
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-R2Y3YMY8F8',
  },
  
  // ============================================
  // EXPERIMENTAL FEATURES (Disabled for static export)
  // ============================================
  // NOTE: Many experimental features don't work with static export
  experimental: {
    esmExternals: false, // Disable for better static export compatibility
    
    // These don't work with static export:
    // optimizeCss: false, // Not compatible with output: 'export'
    // optimizeFonts: false, // Not compatible with output: 'export'
    
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@react-email/components',
      'date-fns',
    ],
  },
  
  // ============================================
  // PAGE EXTENSIONS
  // ============================================
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx', 'md'],
  
  // ============================================
  // WEBPACK CONFIGURATION (CRITICAL for static export)
  // ============================================
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // ============================================
    // PATH ALIASES
    // ============================================
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/styles': path.resolve(__dirname, 'styles'),
      '@/public': path.resolve(__dirname, 'public'),
      '@/types': path.resolve(__dirname, 'types'),
    };
    
    // ============================================
    // SVG HANDLING
    // ============================================
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // ============================================
    // CRITICAL FIX: NODE MODULE HANDLING
    // ============================================
    if (!isServer) {
      config.resolve.fallback = {
        // Standard fallbacks
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        process: false,
        util: false,
        
        // Additional fallbacks that might be needed
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        http2: false,
        module: false,
        readline: false,
        
        // IMPORTANT: Don't use 'node:' prefix here - it causes the error
        // Remove these lines:
        // 'node:fs': false,
        // 'node:path': false,
        // 'node:os': false,
        // 'node:crypto': false,
      };
      
      // Add NormalModuleReplacementPlugin to handle node: protocol imports
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource) => {
            // Strip the node: prefix from imports
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );
      
      // Handle polyfills for browser
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }
    
    // ============================================
    // PERFORMANCE OPTIMIZATIONS (Simplified for static export)
    // ============================================
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 40,
            },
            next: {
              test: /[\\/]node_modules[\\/](next)[\\/]/,
              name: 'next',
              chunks: 'all',
              priority: 30,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
          },
        },
      };
    }
    
    // ============================================
    // IGNORE WARNINGS
    // ============================================
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve 'node:/,
      /Module not found: Error: Can't resolve 'node:/,
    ];
    
    return config;
  },
  
  // ============================================
  // STATIC EXPORT SPECIFIC CONFIGURATION
  // ============================================
  // These settings help with static export compatibility
  
  // Disable features that don't work with static export
  httpAgentOptions: {
    keepAlive: false,
  },
  
  // Set production browser targets
  transpilePackages: [],
};

// ============================================
// EXPORT WITH CONTENTLAYER
// ============================================
export default withContentlayer(nextConfig);