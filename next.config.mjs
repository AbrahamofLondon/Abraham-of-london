/**
 * next.config.mjs — Netlify-aligned build configuration
 * Restores deploy controls, canonical redirects, security headers,
 * and server-side chunk discipline without reintroducing standalone output.
 */

import path from "path";
import fs from "node:fs";
import { fileURLToPath } from "url";
import { withContentlayer } from "next-contentlayer2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MB = 1024 * 1024;

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  productionBrowserSourceMaps: false,

  typescript: {
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
   * Keep heavy Node-only packages external on the server where possible.
   * This reduces bundling pressure, though it does not fix a bad import graph
   * on its own.
   */
  serverExternalPackages: [
    "@prisma/client",
    "contentlayer2",
    "next-contentlayer2",
    "@react-pdf/renderer",
    "canvas",
    "jsdom",
    "sharp",
  ],

  /**
   * Trace pruning.
   * Next.js supports outputFileTracingRoot / Excludes for cases where traces
   * pull in too much baggage. This is one of the legitimate controls worth
   * keeping here. :contentReference[oaicite:1]{index=1}
   */
  outputFileTracingRoot: process.cwd(),
  outputFileTracingExcludes: {
    "/*": [
      "./.git/**",
      "./.contentlayer/.cache/**",
      "./node_modules/.cache/**",
      "./node_modules/typescript/**",
      "./node_modules/sass/**",
      "./node_modules/@esbuild/**",
      "./.contentlayer/generated/**/_index.json",
      "./private_storage/**",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    qualities: [75, 82, 85],
  },

  httpAgentOptions: {
    keepAlive: true,
  },

  /**
   * Canonical redirects restored here as app-level routing truth.
   * If any legacy target differs in your original config, adjust only the
   * destination string — keep the structure.
   */
  async redirects() {
    return [
      {
        source: "/terms-of-service",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/security-policy",
        destination: "/security",
        permanent: true,
      },
      {
        source: "/strategy-room",
        destination: "/consulting/strategy-room",
        permanent: true,
      },
      {
        source: "/diagnostic",
        destination: "/consulting/strategy-room",
        permanent: true,
      },
      {
        source: "/essays/:slug*",
        destination: "/blog/:slug*",
        permanent: true,
      },
    ];
  },

  /**
   * Security and immutable asset headers restored.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    config.module = {
      ...config.module,
      exprContextCritical: false,
      unknownContextCritical: false,
    };

    config.infrastructureLogging = {
      level: "error",
    };

    if (config.cache && config.cache.type === "filesystem") {
      config.cache.maxMemoryGenerations = 1;
    }

    /**
     * Client-side chunk discipline.
     */
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...(config.optimization?.splitChunks || {}),
          chunks: "all",
          maxSize: 244000,
        },
      };
    }

    /**
     * Server-side chunk discipline.
     * This helps prevent single grotesque server chunks from ballooning into
     * 40+ MB monsters. It does not reduce total traced payload if the import
     * graph is still dragging in the whole empire, but it does stop webpack
     * from emitting single monolithic chunks quite so eagerly.
     */
    if (!dev && isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          minSize: 20 * 1024,
          maxSize: 10 * MB,
          enforceSizeThreshold: 8 * MB,
          minChunks: 1,
          automaticNameDelimiter: "-",
          cacheGroups: {
            default: false,
            defaultVendors: false,

            framework: {
              test: /[\\/]node_modules[\\/]/,
              name: "server-framework",
              priority: 10,
              reuseExistingChunk: true,
            },

            heavyServerVendors: {
              test: /[\\/]node_modules[\\/](?:@react-pdf[\\/]|pdfkit[\\/]|fontkit[\\/]|canvas[\\/]|sharp[\\/]|@img[\\/]|@prisma[\\/]|\.prisma[\\/]|jsdom[\\/]|contentlayer2[\\/]|next-contentlayer2[\\/])/,
              name: "server-heavy-vendors",
              priority: 20,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };

      /**
       * Server stats emitter (diagnostic).
       *
       * Taps webpack's `done` hook after the production server
       * compilation and writes a stats JSON to .next/server/server-stats.json.
       * Read back by scripts/diagnostic/stats-analyzer.mjs in the Netlify
       * build command to enumerate which modules land in each oversized
       * commons chunk.
       *
       * Guarded on `!dev && isServer` so it never runs in dev or for the
       * client build. Does not mutate config.optimization or bundle output.
       */
      config.plugins = config.plugins || [];
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.done.tap("ServerStatsEmitter", (stats) => {
            try {
              const statsJson = stats.toJson({
                all: false,
                chunks: true,
                chunkModules: true,
                modules: true,
                reasons: false,
                source: false,
                chunkOrigins: true,
                ids: true,
                entrypoints: true,
              });
              const outPath = path.join(
                process.cwd(),
                ".next/server/server-stats.json",
              );
              fs.mkdirSync(path.dirname(outPath), { recursive: true });
              fs.writeFileSync(outPath, JSON.stringify(statsJson, null, 0));
              console.log(
                "STATS: wrote server-stats.json (" +
                  Math.round(fs.statSync(outPath).size / 1024) +
                  " KB)",
              );
            } catch (e) {
              console.error("STATS: failed to write:", e && e.message);
            }
          });
        },
      });
    }

    return config;
  },
};

export default withContentlayer(nextConfig);