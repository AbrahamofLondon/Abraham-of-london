/**
 * next.config.mjs — V12.0 (Abraham of London Performance Hardening)
 * Optimized for Netlify Build Times and Webpack Cache Efficiency.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import path from "path";
import { fileURLToPath } from "url";
import { withContentlayer } from "next-contentlayer2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  productionBrowserSourceMaps: false,

  typescript: {
    // Type errors are tracked via tsc --noEmit in CI.
    // Build compilation succeeds — only the strict checker blocks.
    //
    // RETIREMENT PATH: This flag stays true through the recovery merge and
    // the schema PR chain. It is flipped to false in the final PR of
    // SCHEMA-PR-CHAIN-CHECKLIST-01 (PR 4), after tier/identity/status
    // honesty lands end-to-end. Any residual errors at that point must map
    // to the explicitly-deferred non-chain debt surfaces named in DEBT.md.
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "date-fns",
      "lodash-es",
    ],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  /**
   * ✅ SERVER EXTERNAL PACKAGES
   * Prevents Webpack from attempting to bundle heavy Node-only binaries.
   */
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "contentlayer2",
    "next-contentlayer2",
    "@react-pdf/renderer",
    "canvas",
    "jsdom",
    "resend",
    "nodemailer",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "sharp",
    "better-sqlite3",
    "puppeteer",
    "puppeteer-core",
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    qualities: [75, 82, 85],
  },

  httpAgentOptions: {
    keepAlive: true,
  },

  webpack: (config, { isServer, dev }) => {
    // 1. Alias Resolution
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    /**
     * 2. ✅ CRITICAL: DYNAMIC CONTEXT RESOLUTION
     * unknownContextCritical: false silences the Contentlayer internal import errors.
     * exprContextCritical: false allows the dynamic PDF template loading.
     */
    config.module = {
      ...config.module,
      exprContextCritical: false,
      unknownContextCritical: false,
    };

    /**
     * 3. ✅ LOGGING & CACHE OPTIMIZATION
     * Prevents the build process from hanging on stdout logging and stops
     * large serialized string bloat in the Webpack filesystem cache.
     */
    config.infrastructureLogging = {
      level: "error",
    };

    if (config.cache && config.cache.type === "filesystem") {
      config.cache.maxMemoryGenerations = 1;
    }

    // 4. Client-side optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          maxSize: 244000,
        },
      };
    }

    // 5. Build Safety: Block server-only logic from client bundles
    if (!isServer) {
      config.module.rules.push({
        test: /\.mdx?$/,
        include: [path.resolve(__dirname, "content")],
        use: "null-loader",
      });

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        canvas: false,
        net: false,
        tls: false,
      };
    }

    if (dev) {
      config.module.rules.push({
        test: /\.map$/,
        use: "null-loader",
      });
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default withContentlayer(nextConfig);
