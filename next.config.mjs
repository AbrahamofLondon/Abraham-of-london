// next.config.mjs — ENTERPRISE PRODUCTION CONFIG (HARDENED, FAIL-SAFE)
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/**
 * Safe resolver:
 * - returns null if module is missing (prevents build failures)
 */
function tryResolve(id) {
  try {
    return require.resolve(id);
  } catch {
    return null;
  }
}

/**
 * Only enable browser polyfills if the project actually has them installed.
 * This prevents "Cannot find module 'crypto-browserify'" type failures.
 */
function buildBrowserFallbacks() {
  const crypto = tryResolve("crypto-browserify");
  const stream = tryResolve("stream-browserify");
  const url = tryResolve("url/");
  const util = tryResolve("util/");
  const path = tryResolve("path-browserify");
  const os = tryResolve("os-browserify/browser"); // prefer /browser entry
  // If some are missing, we simply omit them (webpack will handle, or code must avoid them)

  return {
    fs: false,
    net: false,
    tls: false,
    dns: false,
    child_process: false,
    ...(crypto ? { crypto } : {}),
    ...(stream ? { stream } : {}),
    ...(url ? { url } : {}),
    ...(util ? { util } : {}),
    ...(path ? { path } : {}),
    ...(os ? { os } : {}),
  };
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  // Keep high enough for large SSG, but not absurd
  staticPageGenerationTimeout: 300,

  // Ship-first (your choice) — do not block production deploy on TS errors
  typescript: {
    ignoreBuildErrors: true,
  },

  env: {
    CONTENTLAYER_DISABLE_WARNINGS: "true",
    NEXT_PUBLIC_SITE_URL:
      process.env.NODE_ENV === "production"
        ? "https://www.abrahamoflondon.org"
        : "http://localhost:3000",
  },

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "clsx",
      "tailwind-merge",
      "framer-motion",
    ],
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    disableStaticImages: process.platform === "win32",
  },

  transpilePackages: [
    "lucide-react",
    "date-fns",
    "clsx",
    "tailwind-merge",
    "framer-motion",
  ],

  async redirects() {
    const redirects = [
      { source: "/workshop/purpose-pyramid", destination: "/workshops/purpose-pyramid", permanent: true },
      { source: "/workshop/decision-matrix", destination: "/workshops/decision-matrix", permanent: true },
      { source: "/workshop/legacy-canvas", destination: "/workshops/legacy-canvas", permanent: true },
      { source: "/workshops/purpose-pyramid-workshop", destination: "/workshops/purpose-pyramid", permanent: true },
      { source: "/workshops/decision-matrix-workshop", destination: "/workshops/decision-matrix", permanent: true },
      { source: "/workshops/legacy-canvas-workshop", destination: "/workshops/legacy-canvas", permanent: true },

      { source: "/resources/leadership-standards", destination: "/resources/leadership-standards-blueprint", permanent: true },
      { source: "/resources/purpose-pyramid-guide", destination: "/resources/purpose-pyramid", permanent: true },
      { source: "/resources/legacy-framework", destination: "/resources/legacy-canvas", permanent: true },

      { source: "/downloads/purpose-pyramid-worksheet-fillable.pdf", destination: "/downloads/purpose-pyramid", permanent: true },
      { source: "/downloads/decision-matrix-worksheet-fillable.pdf", destination: "/downloads/decision-matrix", permanent: true },
      { source: "/downloads/legacy-canvas-worksheet-fillable.pdf", destination: "/downloads/legacy-canvas", permanent: true },

      { source: "/public/downloads/purpose-pyramid.pdf", destination: "/downloads/purpose-pyramid.pdf", permanent: true },
      { source: "/public/downloads/decision-matrix.pdf", destination: "/downloads/decision-matrix.pdf", permanent: true },
      { source: "/public/downloads/legacy-canvas.pdf", destination: "/downloads/legacy-canvas.pdf", permanent: true },

      { source: "/index.html", destination: "/", permanent: true },

      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/get-in-touch", destination: "/contact", permanent: true },

      { source: "/services/coaching", destination: "/services/executive-coaching", permanent: true },
      { source: "/services/consulting", destination: "/services/leadership-development", permanent: true },

      { source: "/blog/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/articles/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/news/:slug", destination: "/insights/:slug", permanent: true },

      { source: "/downloads/leadership-standards-blueprint.pdf", destination: "/downloads/leadership-standards-blueprint", permanent: true },
    ];

    return redirects.filter((r) => typeof r.destination === "string" && r.destination.trim() !== "");
  },

  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    const csp = [
      "default-src 'self'",
      [
        "script-src 'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://www.google.com",
        "https://www.gstatic.com",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://app.netlify.com",
        "https://*.netlify.app",
        "https://*.netlify.com",
      ].join(" "),
      [
        "connect-src 'self'",
        "https://www.google.com",
        "https://www.google-analytics.com",
        "https://*.netlify.app",
        "https://*.netlify.com",
        "https://api.netlify.com",
        "https://*.auth0.com",
        "wss://*.netlify.app",
      ].join(" "),
      ["img-src 'self'", "data:", "blob:", "https:"].join(" "),
      ["style-src 'self'", "'unsafe-inline'", "https://fonts.googleapis.com"].join(" "),
      ["font-src 'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com"].join(" "),
      ["frame-src 'self'", "https://www.google.com", "https://app.netlify.com", "https://identity.netlify.com"].join(" "),
      ["media-src 'self'", "data:", "https:"].join(" "),
      "object-src 'none'",
      "base-uri 'self'",
      ["form-action 'self'", "https://*.netlify.app", "https://*.netlify.com"].join(" "),
      "frame-ancestors 'none'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    // Production caching: do NOT set no-store for everything.
    // Let Next handle HTML caching semantics; only lock down truly sensitive paths elsewhere.
    const defaultCache = isProd ? "public, max-age=0, must-revalidate" : "no-store";

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
        source: "/downloads/:path*.pdf",
        headers: [
          { key: "Content-Type", value: "application/pdf" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/assets/downloads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Cache-Control", value: defaultCache },
          ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
          {
            key: "Permissions-Policy",
            value: [
              "accelerometer=()",
              "ambient-light-sensor=()",
              "autoplay=()",
              "battery=()",
              "camera=()",
              "display-capture=()",
              "document-domain=()",
              "encrypted-media=()",
              "execution-while-not-rendered=()",
              "execution-while-out-of-viewport=()",
              "fullscreen=()",
              "gamepad=()",
              "geolocation=()",
              "gyroscope=()",
              "layout-animations=()",
              "legacy-image-formats=()",
              "magnetometer=()",
              "microphone=()",
              "midi=()",
              "navigation-override=()",
              "oversized-images=()",
              "payment=()",
              "picture-in-picture=()",
              "publickey-credentials-get=()",
              "screen-wake-lock=()",
              "sync-xhr=()",
              "usb=()",
              "web-share=()",
              "xr-spatial-tracking=()",
              "clipboard-read=(self)",
              "clipboard-write=(self)",
            ].join(", "),
          },
          ...(process.env.NETLIFY_SITE_ID ? [{ key: "X-Netlify-ID", value: process.env.NETLIFY_SITE_ID }] : []),
          ...(process.env.NETLIFY_EDGE_HANDLER ? [{ key: "X-Netlify-Edge", value: process.env.NETLIFY_EDGE_HANDLER }] : []),
        ],
      },
    ];
  },

  webpack: (config, { isServer, dev }) => {
    config.plugins = Array.isArray(config.plugins) ? config.plugins : [];
    config.module.rules = Array.isArray(config.module.rules) ? config.module.rules : [];

    // Windows watch stability (dev-only)
    if (process.platform === "win32" && dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/.contentlayer/**",
          "**/public/**",
          "**/*.pdf",
          "**/*.pptx",
          "**/*.docx",
          "**/*.xlsx",
          "**/*.zip",
          "**/*.rar",
          "**/*.7z",
          "**/*.tar",
          "**/*.gz",
          "**/*.ttf",
          "**/*.otf",
          "**/*.woff",
          "**/*.woff2",
          "**/*.eot",
          "**/*.{png,jpg,jpeg,gif,bmp,webp,avif,ico,svg}",
          "**/*.{mp4,webm,mov,avi,wmv,mp3,wav,ogg,m4a,flac}",
          "**/Thumbs.db",
          "**/desktop.ini",
          "**/*.lnk",
          "**/*.tmp",
          "**/*.temp",
        ],
      };
    }

    // Do NOT add aggressive asset/resource rules for everything.
    // Next already handles assets + public folder. Adding rules can increase build time.
    // Keep only what you truly need (none required here).

    // Optional browser fallbacks (only if needed & installed)
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        ...buildBrowserFallbacks(),
      };
    }

    return config;
  },
};

// Optional contentlayer wrapper (v2 only) — fail-safe
async function withOptionalContentlayer(config) {
  try {
    const mod = await import("next-contentlayer2");
    if (typeof mod.withContentlayer === "function") {
      return mod.withContentlayer(config);
    }
    return config;
  } catch {
    return config;
  }
}

export default withOptionalContentlayer(nextConfig);