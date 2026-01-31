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
 */
function buildBrowserFallbacks() {
  const crypto = tryResolve("crypto-browserify");
  const stream = tryResolve("stream-browserify");
  const url = tryResolve("url/");
  const util = tryResolve("util/");
  const path = tryResolve("path-browserify");
  const os = tryResolve("os-browserify/browser");

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

  // SSG Performance for the 75+ intelligence briefs
  staticPageGenerationTimeout: 300,

  typescript: {
    ignoreBuildErrors: true, // Priority: Deployment speed
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
    minimumCacheTTL: 3600, // Optimized for high-traffic assets
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

  async rewrites() {
    return [
      // Dynamic Sitemap Routing Logic
      { source: "/blog-sitemap.xml", destination: "/api/sitemaps/blog-sitemap" },
      { source: "/canons-sitemap.xml", destination: "/api/sitemaps/canons-sitemap" },
      { source: "/strategies-sitemap.xml", destination: "/api/sitemaps/strategies-sitemap" },
      { source: "/resources-sitemap.xml", destination: "/api/sitemaps/resources-sitemap" },
      { source: "/books-sitemap.xml", destination: "/api/sitemaps/books-sitemap" },
    ];
  },

  async redirects() {
    return [
      // Workshop & Resource Consolidation
      { source: "/workshop/:slug", destination: "/workshops/:slug", permanent: true },
      { source: "/resources/leadership-standards", destination: "/resources/leadership-standards-blueprint", permanent: true },
      { source: "/blog/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/articles/:slug", destination: "/insights/:slug", permanent: true },
      // Legacy index cleanup
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
    ].filter((r) => r.destination.trim() !== "");
  },

  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    // Hardened Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdn.jsdelivr.net",
      "connect-src 'self' https://www.google-analytics.com https://*.netlify.app https://*.netlify.com",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "frame-src 'self' https://www.google.com https://app.netlify.com",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  webpack: (config, { isServer, dev }) => {
    // Windows dev stability
    if (process.platform === "win32" && dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**", "**/.next/**", "**/.contentlayer/**"],
      };
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ...buildBrowserFallbacks(),
      };
    }

    return config;
  },
};

// Fail-safe Contentlayer Wrapper
async function withOptionalContentlayer(config) {
  try {
    const mod = await import("next-contentlayer2");
    return mod.withContentlayer ? mod.withContentlayer(config) : config;
  } catch {
    try {
      const modLegacy = await import("next-contentlayer");
      return modLegacy.withContentlayer ? modLegacy.withContentlayer(config) : config;
    } catch {
      return config;
    }
  }
}

export default await withOptionalContentlayer(nextConfig);