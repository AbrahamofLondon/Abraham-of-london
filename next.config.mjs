/**
 * next.config.mjs — Netlify-aligned build configuration
 * Restores deploy controls, canonical redirects, security headers,
 * and server-side chunk discipline without reintroducing standalone output.
 */

import path from "path";
import { fileURLToPath } from "url";
import { withContentlayer } from "next-contentlayer2";

// ─────────────────────────────────────────────────────────────────────────────
// BUILD DIAGNOSTIC — capture silent failures during `next build`.
//
// When Next's page data collection phase crashes with no visible stack, the
// real cause is often an unhandled promise rejection or an uncaught exception
// thrown asynchronously from a getStaticProps / getStaticPaths call. The
// build log shows only "Collecting page data... ✗" with no details. These
// two hooks log full error details so the failure is no longer silent.
//
// Scoped to production builds (NODE_ENV=production) so dev server output
// is not affected.
// ─────────────────────────────────────────────────────────────────────────────

// Force full stack traces — default is 10 frames which often truncates the
// useful part of async error chains.
Error.stackTraceLimit = Infinity;

if (process.env.NODE_ENV === "production") {
  process.on("unhandledRejection", (reason, promise) => {
    // eslint-disable-next-line no-console
    console.error(
      "[BUILD DIAGNOSTIC] unhandledRejection:",
      reason instanceof Error
        ? { message: reason.message, stack: reason.stack }
        : reason,
    );
  });

  process.on("uncaughtException", (err) => {
    // eslint-disable-next-line no-console
    console.error("[BUILD DIAGNOSTIC] uncaughtException:", {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
    });
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MB = 1024 * 1024;
const isDev = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  // unsafe-eval is required in development for Next.js Fast Refresh / React error overlay.
  // In production it is removed — Google Tag Manager and Analytics do not require it.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://*.neon.tech https://api.stripe.com https://*.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Standalone output is required for Netlify's handler packaging.
  // On Vercel, standalone is unnecessary: Vercel has its own deployment
  // packaging and does NOT need .next/standalone/. More importantly,
  // creating standalone copies all traced node_modules (~1–3 GB) into
  // .next/standalone/node_modules/ — this post-webpack copy OOMs the
  // 8 GB Vercel build container every time.
  // VERCEL=1 is automatically set by Vercel in every build environment.
  output: process.env.VERCEL ? undefined : "standalone",

  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  productionBrowserSourceMaps: false,

  // Next.js 16+ defaults to Turbopack. This empty config acknowledges the
  // webpack config below exists and silences the "no turbopack config"
  // error when `--webpack` is not explicitly passed.
  turbopack: {},

  // Explicit — default is 60 seconds, setting it here forces Next to log
  // the specific page name when it times out during static generation.
  staticPageGenerationTimeout: 60,

  typescript: {
    // Skip the post-webpack tsc pass on Vercel (set NEXT_SKIP_TYPE_CHECK=1 in vercel.json env).
    // Type errors are caught locally and in CI; running a full tsc on the 8 GB Vercel
    // build container OOMs because the heap limit plus the TypeScript worker exhaust RAM.
    ignoreBuildErrors: process.env.NEXT_SKIP_TYPE_CHECK === "1",
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
    "@neondatabase/serverless",
    "contentlayer2",
    "next-contentlayer2",
    "@react-pdf/renderer",
    "canvas",
    "jsdom",
    "sharp",
    "puppeteer",
    "puppeteer-core",
    "@puppeteer/browsers",
  ],

  /**
   * Trace pruning.
   * Next.js supports outputFileTracingRoot / Excludes for cases where traces
   * pull in too much baggage. This is one of the legitimate controls worth
   * keeping here. :contentReference[oaicite:1]{index=1}
   */
  outputFileTracingRoot: process.cwd(),
  outputFileTracingExcludes: {
    "/downloads/[...slug]": [
      "video/**",
      ".next/cache/**",
      ".contentlayer/.cache/**",
      "private_storage/**",
      "backup/**",
      "*.log",
      "*.db",
      "*.zip",
      "public/assets/videos/**",
    ],
    "/api/downloads/resolve/[slug]": [
      "video/**",
      ".next/cache/**",
      ".contentlayer/.cache/**",
      "private_storage/**",
      "backup/**",
      "*.log",
      "*.db",
      "*.zip",
      "public/assets/videos/**",
    ],
    "/api/downloads/resolve/[slug]/[...rest]": [
      "video/**",
      ".next/cache/**",
      ".contentlayer/.cache/**",
      "private_storage/**",
      "backup/**",
      "*.log",
      "*.db",
      "*.zip",
      "public/assets/videos/**",
    ],
    "/api/private/vault/[...path]": [
      "video/**",
      ".next/cache/**",
      ".contentlayer/.cache/**",
      "private_storage/**",
      "backup/**",
      "*.log",
      "*.db",
      "*.zip",
      "public/assets/videos/**",
      "./video/**",
      "./.next/cache/**",
      "./.contentlayer/.cache/**",
      "./backup/**",
      "./backups/**",
      "./private_storage/**",
      "./build-*.log",
      "./playwright-report/**",
      "./test-results/**",
      "./coverage/**",
      "./*.db",
      "./*.sqlite",
      "./*.sqlite3",
      "./*.zip",
      "./output_tiktok*.mp4",
    ],
    "/*": [
      "./.git/**",
      "./video/**",
      "./.next/cache/**",
      "./.contentlayer/.cache/**",
      "./backup/**",
      "./backups/**",
      "./build-*.log",
      "./playwright-report/**",
      "./test-results/**",
      "./coverage/**",
      "./*.db",
      "./*.sqlite",
      "./*.sqlite3",
      "./*.zip",
      "./output_tiktok*.mp4",
      "./node_modules/.cache/**",
      "./node_modules/typescript/**",
      "./node_modules/sass/**",
      "./node_modules/@esbuild/**",
      "./private_storage/**",

      // Prisma dead weight — schema/migration/introspection/fmt engines are
      // only used by `prisma migrate` / `prisma introspect` at CLI time.
      // They are NOT used at runtime by `@prisma/client`.
      //
      // CRITICAL: the Linux runtime engine
      //   ./node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node
      // MUST NOT be excluded. It is the only query engine that runs on
      // Netlify's production Linux environment and is required at
      // request time by every route that touches Prisma. All other
      // platform-specific variants (musl, debian, windows, darwin) are
      // stripped below.
      "./.prisma/client/schema-engine*",
      "./node_modules/@prisma/engines/**",
      "./node_modules/prisma/build/**",
      "./node_modules/@prisma/client/generator-build/**",

      // Cross-platform query engines — we only run on Netlify Linux
      // (rhel-openssl-3.0.x). Windows/darwin/debian/musl binaries are
      // build artifacts of `prisma generate` from other environments
      // that must never reach the handler.
      "./node_modules/.prisma/client/libquery_engine-linux-musl*",
      "./node_modules/.prisma/client/libquery_engine-debian*",
      "./node_modules/.prisma/client/libquery_engine-windows*",
      "./node_modules/.prisma/client/libquery_engine-darwin*",

      // Puppeteer + bundled Chromium (~150 MB combined on Netlify Linux).
      // The only routes that ever referenced Puppeteer
      // (pages/api/pdfs/generate-all.ts and pages/api/pdfs/[id]/generate.ts)
      // have been stubbed to a 503 because the underlying workflow
      // relies on writing to `public/assets/downloads/`, which does
      // not persist on Netlify functions. Regeneration is done via
      // the build-time CLI instead, so Puppeteer has zero runtime
      // reachability from the deployed handler and can be stripped
      // from the trace entirely.
      "./node_modules/puppeteer/**",
      "./node_modules/puppeteer-core/**",
      "./node_modules/@puppeteer/**",
      "./node_modules/chrome-headless-shell/**",
      "./node_modules/.cache/puppeteer/**",

      // ── Build-only webpack toolchain ────────────────────────────────────────
      // These packages appear in next-server.js.nft.json because Next.js
      // bundles webpack for its own build pipeline. None of them are required
      // at request time by the deployed Lambda handler.
      "./node_modules/webpack/**",
      "./node_modules/webpack-sources/**",
      "./node_modules/enhanced-resolve/**",
      "./node_modules/@webassemblyjs/**",
      "./node_modules/acorn/**",
      "./node_modules/acorn-import-attributes/**",
      "./node_modules/eslint-scope/**",

      // ── Build-only CSS / optimisation tools ─────────────────────────────────
      // postcss, critters, terser, uglify-js are invoked during `next build`
      // for CSS processing, critical-CSS extraction, and minification.
      // None execute at request time.
      "./node_modules/postcss/**",
      "./node_modules/critters/**",
      "./node_modules/beasties/**",
      "./node_modules/terser/**",
      "./node_modules/terser-webpack-plugin/**",
      "./node_modules/uglify-js/**",

      // ── Build-only browser-compat data ──────────────────────────────────────
      // caniuse-lite and browserslist are consumed by postcss/autoprefixer
      // at build time to emit the correct vendor prefixes. The deployed
      // server never inspects browser compatibility at runtime.
      "./node_modules/caniuse-lite/**",
      "./node_modules/browserslist/**",
      "./node_modules/electron-to-chromium/**",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: false,
    unoptimized: true,
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
        source: "/diagnostic",
        destination: "/strategy-room",
        permanent: true,
      },
      {
        source: "/consulting",
        destination: "/counsel",
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
    const productionSecurityHeaders = process.env.NODE_ENV === "production"
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ]
      : [];

    return [
      {
        // Prevent browsers from caching redirects on public diagnostic routes
        source: "/diagnostics/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ...productionSecurityHeaders,
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
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

    // Prevent the dev-mode file watcher from monitoring .contentlayer/
    // and other generated/cache dirs. Without this, the Contentlayer
    // watch process + Next's watcher create a feedback loop: page load
    // reads _index.json → watcher detects "change" (Windows updates
    // last-access time) → Contentlayer rebuilds → Next detects new
    // files → Fast Refresh full reload → page reloads → infinite loop.
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          ...(config.watchOptions?.ignored || []),
          "**/.contentlayer/**",
          "**/.next/**",
          "**/.netlify/**",
          "**/node_modules/**",
          "**/.git/**",
          "**/var/**",
          "**/.reports/**",
          "**/tmp/**",
        ],
      };
    }

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

    return config;
  },
};

export default withContentlayer(nextConfig);
