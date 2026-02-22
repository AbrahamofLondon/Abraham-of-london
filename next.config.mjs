// next.config.mjs — ABRAHAM OF LONDON (NETLIFY-STABLE, ASSET-SAFE, HYBRID ROUTING FRIENDLY)
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

  // ✅ Do NOT force standalone for Netlify Next runtime.
  // Netlify's plugin packages SSR correctly. Standalone + custom handler is what created your 250MB function mess.
  // output: "standalone",

  // ✅ Keep builds strict where possible (turning this off hides real failures)
  typescript: {
    ignoreBuildErrors: false,
  },

  // ✅ If you had transient type issues during firefighting, fix them properly instead of ignoring.
  eslint: {
    ignoreDuringBuilds: false,
  },

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
  },

  transpilePackages: ["framer-motion"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // ✅ Keep webpack minimal. Don’t polyfill half of Node into the browser unless a specific error forces it.
  webpack: (config) => {
    // Keep your @ alias stable if you rely on it
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    // Prevent accidental bundling of server-only modules into client
    if (!config.resolve.fallback) config.resolve.fallback = {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    config.infrastructureLogging = { level: "error" };
    return config;
  },

  distDir: ".next",
};

let finalConfig = nextConfig;
try {
  const { withContentlayer } = require("next-contentlayer2");
  finalConfig = withContentlayer(nextConfig);
  console.log("✅ Contentlayer configured successfully");
} catch (e) {
  console.log("⚠️ Contentlayer wrapper not applied:", e?.message || e);
}

export default finalConfig;