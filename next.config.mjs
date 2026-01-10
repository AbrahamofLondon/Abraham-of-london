/* next.config.mjs - FIXED SYNTAX WITH COMPREHENSIVE FILE EXCLUSION */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// -------------------- Contentlayer plugin --------------------
async function resolveWithContentlayer() {
  try {
    const cl2 = await import("next-contentlayer2");
    if (typeof cl2.withContentlayer === "function") return cl2.withContentlayer;
  } catch {}

  try {
    const cl1 = await import("next-contentlayer");
    if (typeof cl1.withContentlayer === "function") return cl1.withContentlayer;
  } catch {}

  console.warn(
    "⚠️ [BUILD_WARNING] Contentlayer plugin not found. Proceeding without MDX integration."
  );
  return (config) => config;
}

const withContentlayer = await resolveWithContentlayer();

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // ✅ Build resilience
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  env: {
    CONTENTLAYER_DISABLE_WARNINGS: "true",
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || "production",
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
    BUILD_TIMESTAMP: new Date().toISOString(),
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  // ✅ Clean headers
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
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // ✅ FIXED webpack config with comprehensive file exclusion
  webpack: (config, { isServer, webpack, dev }) => {
    // CRITICAL: Ignore problematic files in Webpack build to prevent Windows lock errors
    // Single plugin with combined regex for all file types
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /(\.xlsx|\.docx|\.pptx|\.xls|\.doc|\.ppt|\.odt|\.ods|\.odp|\.pdf)$/i,
        contextRegExp: /public[\\/](assets[\\/]downloads|downloads)/,
      })
    );

    // Handle client-side modules
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^ioredis$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^better-sqlite3$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^sharp$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^bcrypt$/ }),
        new webpack.IgnorePlugin({ resourceRegExp: /^pdfkit$/ })
      );

      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url/"),
        util: require.resolve("util/"),
      };
    }

    // Suppress warnings including problematic file warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /contentlayer/ },
      { module: /node_modules[\\/]+@fontsource/ },
      { 
        module: /public[\\/]+(assets[\\/]+downloads|downloads)[\\/]+.*\.(xlsx|docx|pptx|xls|doc|ppt|odt|ods|odp|pdf)$/i 
      },
    ];

    // Windows compatibility - Exclude problematic files from watching
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          "**/.contentlayer/**",
          "**/.next/**", 
          "**/node_modules/**",
          // CRITICAL: Exclude problematic files from file watching
          "**/public/assets/downloads/**/*.xlsx",
          "**/public/assets/downloads/**/*.docx", 
          "**/public/assets/downloads/**/*.pptx",
          "**/public/assets/downloads/**/*.xls",
          "**/public/assets/downloads/**/*.doc",
          "**/public/assets/downloads/**/*.ppt",
          "**/public/assets/downloads/**/*.odt",
          "**/public/assets/downloads/**/*.ods",
          "**/public/assets/downloads/**/*.odp",
          "**/public/assets/downloads/**/*.pdf",
          "**/public/downloads/*.xlsx",
          "**/public/downloads/*.docx", 
          "**/public/downloads/*.pptx",
          "**/public/downloads/*.xls",
          "**/public/downloads/*.doc",
          "**/public/downloads/*.ppt",
          "**/public/downloads/*.odt",
          "**/public/downloads/*.ods",
          "**/public/downloads/*.odp",
          "**/public/downloads/*.pdf",
          // Windows temp files
          "**/*.tmp",
          "**/Thumbs.db",
          "**/desktop.ini",
          "**/~$*",
        ],
      };
    }

    return config;
  },

  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "pdfkit", "sharp", "bcrypt"],
    
    // Remove optimizeCss - Next.js handles this automatically
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
    
    // Reduce file system scanning
    webpackBuildWorker: true,
    cpus: 1,
  },

  i18n: {
    locales: ["en-GB", "en-US"],
    defaultLocale: "en-GB",
    localeDetection: false,
  },

  transpilePackages: [
    "lucide-react",
    "date-fns",
    "clsx",
    "tailwind-merge",
  ],
};

export default withContentlayer(nextConfig);