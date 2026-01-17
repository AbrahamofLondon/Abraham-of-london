// next.config.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const isWindows =
  process.platform === "win32" || String(process.env.IS_WINDOWS).toLowerCase() === "true";

/** @type {import("next").NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 300,

  // Avoid Windows permission/symlink weirdness locally; keep standalone for CI/Linux.
  output: isWindows ? undefined : "standalone",

  experimental: {
    scrollRestoration: true,
  },

  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.NODE_ENV === "production"
        ? "https://www.abrahamoflondon.org"
        : "http://localhost:3000",
    API_VERSION: "v1",
  },

  async redirects() {
    return [
      { source: "/api/v1/:path*", destination: "/api/:path*", permanent: false },
      { source: "/health", destination: "/api/health", permanent: false },
      { source: "/api/v2/health", destination: "/api/v2/health", permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-API-Version", value: "v1" },
          { key: "X-API-Router", value: "pages" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        source: "/api/v2/:path*",
        headers: [
          { key: "X-API-Version", value: "v2" },
          { key: "X-API-Router", value: "app" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    // Windows: reduce filesystem cache sensitivity
    if (isWindows) {
      config.cache = false;
    }

    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        path: require.resolve("path-browserify"),
      };
    }
    return config;
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    unoptimized: false,
  },
};

// HARD REQUIRE: Contentlayer must load in production builds.
let withContentlayer;
try {
  ({ withContentlayer } = await import("next-contentlayer2"));
} catch (e) {
  console.error("\n[Contentlayer] next-contentlayer2 missing/unloadable.\n");
  throw e;
}

export default withContentlayer(baseConfig);