// next.config.mjs
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 300,

  turbopack: {},

  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Moved from experimental to top level
  outputFileTracingRoot: path.join(__dirname, '../../'),
  outputFileTracingExcludes: {
    '/*': [
      './public/**/*',
      './node_modules/sharp/**/*',
      './node_modules/@img/**/*',
      './node_modules/playwright/**/*',
      './node_modules/puppeteer/**/*',
      './node_modules/chrome-aws-lambda/**/*',
      './node_modules/aws-sdk/**/*',
    ],
  },

  output: 'standalone',

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
    // ✅ Removed outputFileTracingRoot and outputFileTracingExcludes from here
  },

  transpilePackages: ["framer-motion"],

  serverExternalPackages: [
    'sharp', 
    'playwright', 
    'puppeteer', 
    'chrome-aws-lambda',
    'aws-sdk',
    'pg',
    'mysql',
    'sqlite3'
  ],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    qualities: [75, 85],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url"),
        util: require.resolve("util"),
        path: require.resolve("path-browserify"),
        os: require.resolve("os-browserify/browser"),
        fs: false,
        net: false,
        tls: false,
      };
    }

    config.infrastructureLogging = { level: "error" };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };

    return config;
  },

  distDir: ".next",
};

// --- CONTENTLAYER WRAPPER ---
let finalConfig = nextConfig;

try {
  const { withContentlayer } = require("next-contentlayer2");
  finalConfig = withContentlayer(nextConfig);
} catch (e) {
  console.log("⚠️ Contentlayer setup fallback initiated");
}

if (process.platform === "win32") {
  process.on("unhandledRejection", (err) => {
    if (err?.message?.includes("tap")) return;
    console.error(err);
  });
}

export default finalConfig;