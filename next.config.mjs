// next.config.mjs — Robust Final Version (Windows-safe, Contentlayer-friendly)
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional Contentlayer wrapper (works if installed)
let withContentlayer = (cfg) => cfg;
try {
  // NOTE: Keep this sync-ish in ESM. Next will load it fine.
  const mod = await import("next-contentlayer");
  if (typeof mod.withContentlayer === "function") {
    console.log("✅ next-contentlayer detected");
    withContentlayer = mod.withContentlayer;
  } else {
    console.warn("⚠️ next-contentlayer loaded but wrapper missing; continuing without wrapper");
  }
} catch {
  console.warn("⚠️ next-contentlayer not available; continuing without wrapper");
}

/**
 * If you are doing a pure static export build (output: "export"),
 * set NEXT_STATIC_EXPORT=1 in the build environment.
 * This will protect your build by redirecting /board/* away.
 */
const IS_STATIC_EXPORT = process.env.NEXT_STATIC_EXPORT === "1";

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // If you truly use static export, enable this in *your* env (not hard-coded):
  // output: IS_STATIC_EXPORT ? "export" : undefined,

  trailingSlash: false,
  compress: true,

  // Build noise controls (you intentionally ignore type/lint at build time)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  async redirects() {
    // Only protect static export builds when you explicitly opt-in.
    if (!IS_STATIC_EXPORT) return [];

    return [
      // Static export can't safely render dashboards that rely on auth/session.
      { source: "/board/:path*", destination: "/", permanent: false },
    ];
  },

  images: {
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 64, 96, 128],
    formats: ["image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "1.0.0",
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV || "development",
    NEXT_PUBLIC_STATIC_EXPORT: IS_STATIC_EXPORT ? "1" : "0",
  },

  experimental: {
    // Optional: reduces tracing churn; safe because these are public static assets
    outputFileTracingExcludes: {
      "*": ["public/downloads/**", "public/assets/**"],
    },
  },

  webpack: (config, { webpack }) => {
    // Raw-load SQL to prevent parse errors if you ever import it.
    config.module.rules.push({ test: /\.sql$/, use: "raw-loader" });

    // Windows watcher resilience without breaking imports at build-time
    if (process.platform === "win32") {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/.contentlayer/**",
          "**/.image-cache/**",
          "**/.temp/**",
          "**/fixlogs/**",
          "**/public/downloads/**",
          "**/public/assets/**",
          "**/*.pptx",
          "**/*.xlsx",
          "**/*.docx",
          "**/*.pdf",
          "**/*.zip",
        ],
      };
    } else {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/.contentlayer/**",
          "**/public/downloads/**",
        ],
      };
    }

    // Silence “expression dependency” warnings without disabling real caching logic
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    // Alias hardening
    config.resolve = {
      ...config.resolve,
      alias: {
        ...(config.resolve.alias || {}),
        "@": path.resolve(__dirname),
      },
    };

    return config;
  },
};

export default withContentlayer(baseConfig);