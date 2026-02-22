import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 300,
  output: 'standalone', // Essential for Netlify deployment

  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Optimized File Tracing - MOVES heavy lifting outside bundle
  outputFileTracingRoot: path.join(__dirname, './'),
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      './.next/cache/**/*',
      './node_modules/sharp/**/*',
      './node_modules/playwright/**/*',
      './node_modules/puppeteer/**/*',
      './node_modules/chrome-aws-lambda/**/*',
      './node_modules/aws-sdk/**/*',
    ],
  },
  
  // ✅ Explicitly include public files for standalone output
  outputFileTracingIncludes: {
    '/**/*.jpg': ['./public/**/*.jpg'],
    '/**/*.jpeg': ['./public/**/*.jpeg'],
    '/**/*.png': ['./public/**/*.png'],
    '/**/*.gif': ['./public/**/*.gif'],
    '/**/*.svg': ['./public/**/*.svg'],
    '/**/*.webp': ['./public/**/*.webp'],
    '/**/*.avif': ['./public/**/*.avif'],
    '/**/*.ico': ['./public/**/*.ico'],
    '/**/*.pdf': ['./public/**/*.pdf'],
    '/fonts/**/*': ['./public/fonts/**/*'],
    '/images/**/*': ['./public/images/**/*'],
  },

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
    // Enable for better static optimization
    optimizeCss: false, // Set to true if you have CSS issues
  },

  transpilePackages: ["framer-motion"],

  serverExternalPackages: [
    'sharp', 
    'playwright', 
    'puppeteer', 
    'chrome-aws-lambda',
    'aws-sdk',
    'pg',
    'mysql',
    'sqlite3'
  ],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    // Local images from public folder
    domains: [
      'www.abrahamoflondon.org',
      'abrahamoflondon.org',
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Bundle optimization
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  webpack: (config, { isServer, webpack }) => {
    // Client-side fallbacks for Node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url"),
        util: require.resolve("util"),
        path: require.resolve("path-browserify"),
        os: require.resolve("os-browserify/browser"),
        fs: false,
        net: false,
        tls: false,
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser"),
      };
      
      // Add polyfills
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }

    // Server-specific optimizations
    if (isServer) {
      // Ignore .map files from node_modules
      config.module.rules.push({
        test: /\.map$/,
        loader: 'ignore-loader',
      });
    }

    // Suppress excessive logging
    config.infrastructureLogging = { level: "error" };
    
    // Set up aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };

    return config;
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // Redirects (if any)
  async redirects() {
    return [
      // Add any custom redirects here
    ];
  },

  distDir: ".next",
  generateBuildId: async () => {
    // Return a unique build ID
    return `build-${Date.now()}`;
  },
};

// --- CONTENTLAYER WRAPPER ---
let finalConfig = nextConfig;

try {
  const { withContentlayer } = require("next-contentlayer2");
  finalConfig = withContentlayer(nextConfig);
  console.log("✅ Contentlayer configured successfully");
} catch (e) {
  console.log("⚠️ Contentlayer setup fallback initiated", e.message);
}

export default finalConfig;