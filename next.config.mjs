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

  // ✅ Explicitly silence Turbopack warnings while using Webpack
  turbopack: {}, 

  typescript: {
    ignoreBuildErrors: true, 
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
    // 🛡️ DISABLED: Causes document leakage in mixed routers on Windows
    // optimizeCss: true,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // ✅ Allow quality={85} while keeping defaults
    qualities: [75, 85],
  },

  webpack: (config, { isServer }) => {
    // 🛡️ REMOVED: Dangerous plugin filtering that corrupts the module graph
    // if (process.platform === "win32") {
    //   config.plugins = config.plugins?.filter(plugin => {
    //     const pluginName = plugin?.constructor?.name;
    //     return pluginName !== "ContextReplacementPlugin" && 
    //            pluginName !== "NormalModuleReplacementPlugin";
    //   }) || [];
    // }

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
    
    // Explicit Alias Preservation
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };
    
    return config;
  },

  // 🛡️ Temporarily disabled for local Windows stability
  // output: "standalone",
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

// Global Rejection Handling for Windows Build Stability
if (process.platform === "win32") {
  process.on("unhandledRejection", (err) => {
    if (err?.message?.includes("tap")) return;
    console.error(err);
  });
}

export default finalConfig;