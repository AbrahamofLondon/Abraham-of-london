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
  
  // Static export for Netlify
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
    unoptimized: true, // Required for static export
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
  typescript: {
    // In production/CI, strict checking happens in validate:pre-build
    ignoreBuildErrors: isNetlify || process.env.CI === 'true',
  },
  
  eslint: {
    // In production/CI, linting happens in validate:pre-build
    ignoreDuringBuilds: isNetlify || process.env.CI === 'true',
    dirs: ['pages', 'components', 'lib', 'app'],
  },
  
  // ============================================
  // COMPILER OPTIONS
  // ============================================
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    
    // Remove React properties in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    
    // Styled components support (if needed)
    styledComponents: false,
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
  // EXPERIMENTAL FEATURES
  // ============================================
  experimental: {
    // Modern JavaScript features
    esmExternals: true,
    
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@react-email/components',
      'date-fns',
    ],
    
    // Enable modern CSS features
    optimizeCss: true,
    
    // Optimize fonts
    optimizeFonts: true,
  },
  
  // ============================================
  // PAGE EXTENSIONS
  // ============================================
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx', 'md'],
  
  // ============================================
  // WEBPACK CONFIGURATION
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
    // CLIENT-SIDE FALLBACKS
    // ============================================
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        process: false,
        util: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    
    // ============================================
    // PERFORMANCE OPTIMIZATIONS
    // ============================================
    // Improve build performance
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // React/Next.js framework
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            reuseExistingChunk: true,
          },
          // Large libraries
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )?.[1];
              return `lib-${packageName?.replace('@', '')}`;
            },
            priority: 30,
          },
        },
      },
    };
    
    // ============================================
    // IGNORE WARNINGS (Clean builds)
    // ============================================
    config.ignoreWarnings = [
      // Ignore source map warnings
      /Failed to parse source map/,
      // Ignore webpack warnings for optional dependencies
      /Critical dependency: the request of a dependency is an expression/,
    ];
    
    // ============================================
    // PLUGINS
    // ============================================
    config.plugins.push(
      // Define global constants
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(dev),
        __PROD__: JSON.stringify(!dev),
        __BUILD_ID__: JSON.stringify(buildId),
      })
    );
    
    return config;
  },
  
  // ============================================
  // REDIRECTS (if needed before Netlify)
  // ============================================
  async redirects() {
    return [
      // Add any application-level redirects here
      // Domain redirects should be in netlify.toml
    ];
  },
  
  // ============================================
  // HEADERS (Static export - limited support)
  // ============================================
  async headers() {
    // Note: Most headers should be in netlify.toml
    // These only work for Next.js dev server
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

// ============================================
// EXPORT WITH CONTENTLAYER
// ============================================
export default withContentlayer(nextConfig);