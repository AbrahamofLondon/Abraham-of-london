import { createRequire } from "module";
const require = createRequire(import.meta.url);

/**
 * Safe resolver for browser polyfills
 */
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
    if (path) resolved[id.replace('-browserify', '').replace('/browser', '')] = path;
  });

  return {
    fs: false,
    net: false,
    tls: false,
    dns: false,
    child_process: false,
    ...resolved
  };
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  // SSG Performance: Vital for your 75+ intelligence briefs
  staticPageGenerationTimeout: 600, 

  // Combined Linting & Typing Guardrails
  typescript: {
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true, 
  },

  env: {
    CONTENTLAYER_DISABLE_WARNINGS: "true",
    NEXT_PUBLIC_SITE_URL: process.env.NODE_ENV === "production"
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
    dangerouslyAllowSVG: true,
    disableStaticImages: false, 
  },

  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdn.jsdelivr.net",
      "connect-src 'self' https://www.google-analytics.com https://*.netlify.app https://*.netlify.com",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "frame-src 'self' https://www.google.com",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: isProd ? csp : "" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/workshop/:slug", destination: "/workshops/:slug", permanent: true },
      { source: "/blog/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
    ];
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

const finalConfig = async () => {
  try {
    const { withContentlayer } = await import("next-contentlayer2");
    return withContentlayer(nextConfig);
  } catch (e) {
    try {
      const { withContentlayer } = await import("next-contentlayer");
      return withContentlayer(nextConfig);
    } catch (e) {
      console.warn("Contentlayer wrapper failed, returning raw config");
      return nextConfig;
    }
  }
};

export default await finalConfig();