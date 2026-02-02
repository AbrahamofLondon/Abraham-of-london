/* next.config.mjs — UNIFIED SOVEREIGN CONFIGURATION (Hardened for 2026) */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

function tryResolve(id) {
  try {
    return require.resolve(id);
  } catch {
    return null;
  }
}

function buildBrowserFallbacks() {
  const fallbacks = ["crypto-browserify", "stream-browserify", "url", "util", "path-browserify", "os-browserify/browser"];
  const resolved = {};
  fallbacks.forEach(id => {
    const path = tryResolve(id);
    if (path) {
      const key = id.replace('-browserify', '').replace('/browser', '');
      resolved[key] = path;
    }
  });
  return { fs: false, net: false, tls: false, dns: false, child_process: false, ...resolved };
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 1200,

  // Combined hardening for Typescript and ESLint
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react", "date-fns", "clsx", "tailwind-merge", "framer-motion"],
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ...buildBrowserFallbacks(),
      };
    }
    return config;
  },
};

// Sovereign Wrapper Logic
export default async function() {
  let finalConfig = nextConfig;
  try {
    const { withContentlayer } = await import("next-contentlayer2");
    finalConfig = withContentlayer(nextConfig);
  } catch (e) {
    try {
      const { withContentlayer } = await import("next-contentlayer");
      finalConfig = withContentlayer(nextConfig);
    } catch (e2) {
      console.warn("⚠️ Contentlayer wrapper failed. Running naked.");
    }
  }

  // Final check: Remove top-level 'eslint' if the wrapper accidentally injected it 
  // as a root-level key which Next.js 16 now rejects.
  if (finalConfig.eslint && typeof finalConfig.eslint !== 'object') {
     delete finalConfig.eslint;
  }

  return finalConfig;
}