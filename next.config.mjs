// next.config.mjs
import { withContentlayer } from "next-contentlayer2";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  generateEtags: true,
  compress: true,

  // Silence build friction
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Webpack configuration
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

    // CRITICAL: Ignore ioredis and server-only packages in client bundles
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^ioredis$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^better-sqlite3$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^sharp$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^bcrypt$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^pdfkit$/ })
      );

      // Also add to externals
      config.externals = config.externals || [];
      config.externals.push('ioredis', 'better-sqlite3');
    }

    // Ignore warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /contentlayer/ },
      { module: /@contentlayer/ },
      { module: /ioredis/ },
      { module: /better-sqlite3/ },
      { file: /node_modules\/.*/ },
    ];

    // Windows watcher optimization
    if (process.platform === "win32") {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/.contentlayer/**", "**/.next/**", "**/node_modules/**"],
      };
    }

    // Handle font files
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]',
      },
    });

    // Production optimizations
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

    return config;
  },

  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      'pdfkit',
      'pdf-lib',
      'sharp',
      'bcrypt',
      'ioredis',
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

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  env: {
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

// Apply ContentLayer wrapper
export default withContentlayer(nextConfig);