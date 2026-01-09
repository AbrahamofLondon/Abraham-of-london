// next.config.mjs
import { withContentlayer } from "next-contentlayer2";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Silence build friction
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Single env block (do NOT duplicate)
  env: {
    CONTENTLAYER_DISABLE_WARNINGS: "true",
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
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
      {
        source: "/_next/image/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  webpack: (config, { isServer, webpack, dev }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^ioredis$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^better-sqlite3$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^sharp$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^bcrypt$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^pdfkit$/ }),
      );
    }

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /contentlayer/ },
      { module: /@contentlayer/ },
      { module: /node_modules\/@fontsource/ },
    ];

    if (process.platform === "win32") {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/.contentlayer/**", "**/.next/**", "**/node_modules/**"],
      };
    }

    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: "asset/resource",
      generator: { filename: "static/fonts/[name][ext]" },
    });

    // Keep your CSS module tweak if you must, but it’s risky.
    config.module.rules.forEach((rule) => {
      const { oneOf } = rule;
      if (oneOf) {
        oneOf.forEach((one) => {
          if (!one.issuerLayer && one.issuer) delete one.issuer;
        });
      }
    });

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      };

      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 70000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          styles: {
            name: "styles",
            test: /\.(css|scss)$/,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "pdfkit", "sharp", "bcrypt"],
    optimizeCss: true,
    scrollRestoration: true,
    turbo: process.env.TURBOPACK === "true" ? {} : undefined,
    middlewarePrefetch: "flexible",
    optimizePackageImports: ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
  },

  i18n: {
    locales: ["en-GB", "en-US"],
    defaultLocale: "en-GB",
    localeDetection: false,
  },

  async redirects() {
    return [{ source: "/legacy/:path*", destination: "/:path*", permanent: true }];
  },
};

export default withContentlayer(nextConfig);