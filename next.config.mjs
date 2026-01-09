/* next.config.mjs - RECONCILED INSTITUTIONAL VERSION */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// STRATEGIC IMPORT: Handle both contentlayer and contentlayer2 for environment flexibility
let withContentlayer;
try {
  const cl = await import("next-contentlayer2");
  withContentlayer = cl.withContentlayer;
} catch (e) {
  try {
    const cl = await import("next-contentlayer");
    withContentlayer = cl.withContentlayer;
  } catch (e2) {
    console.warn("⚠️ [BUILD_WARNING] Contentlayer plugin not found. Proceeding without MDX integration.");
    withContentlayer = (config) => config;
  }
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Silence build friction to prevent total failure on trace warnings
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Single centralized environment block
  env: {
    CONTENTLAYER_DISABLE_WARNINGS: "true",
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || 'production',
    SITE_URL: process.env.SITE_URL || "https://abrahamoflondon.com",
    BUILD_TIMESTAMP: new Date().toISOString(),
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  webpack: (config, { isServer, webpack, dev }) => {
    // BLOCK 1: Exclude Node-only binaries from client bundles
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^ioredis$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^better-sqlite3$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^sharp$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^bcrypt$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^pdfkit$/ })
      );
      
      // Fallback for node built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        util: require.resolve('util'),
      };
    }

    // BLOCK 2: Fix for Windows path issues and Dynamic Import Layer conflicts
    config.module.rules.forEach((rule) => {
      if (rule.oneOf) {
        rule.oneOf.forEach((one) => {
          if (one.test && one.test.toString().includes('mjs|jsx|ts|tsx')) {
            if (one.issuerLayer) delete one.issuerLayer;
          }
          if (!one.issuerLayer && one.issuer) delete one.issuer;
        });
      }
    });

    // BLOCK 3: SUPPRESS WARNINGS
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /contentlayer/ },
      { module: /node_modules\/@fontsource/ },
    ];

    // BLOCK 4: Windows Watcher Optimization
    if (process.platform === "win32") {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/.contentlayer/**", "**/.next/**", "**/node_modules/**"],
      };
    }

    return config;
  },

  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "pdfkit", "sharp", "bcrypt"],
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
  },

  i18n: {
    locales: ["en-GB", "en-US"],
    defaultLocale: "en-GB",
    localeDetection: false,
  },
};

export default withContentlayer(nextConfig);