import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** 
 * Safe module resolution with fallbacks for browser-compatible polyfills
 */
function tryResolve(id) {
  try {
    return require.resolve(id);
  } catch {
    return null;
  }
}

/** 
 * Maps Node.js modules to browser polyfills or false to ignore
 */
function buildBrowserFallbacks() {
  const polyfillMap = {
    "crypto": "crypto-browserify",
    "stream": "stream-browserify",
    "url": "url",
    "util": "util",
    "path": "path-browserify",
    "os": "os-browserify/browser"
  };
  
  const resolved = {};
  
  // Explicitly disable server-only modules in the browser
  const disabled = {
    fs: false,
    net: false,
    tls: false,
    dns: false,
    child_process: false,
  };
  
  Object.entries(polyfillMap).forEach(([nodeModule, polyfillId]) => {
    const resolvedPath = tryResolve(polyfillId);
    if (resolvedPath) {
      resolved[nodeModule] = resolvedPath;
    }
  });
  
  return { ...disabled, ...resolved };
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  staticPageGenerationTimeout: 300,
  
  typescript: { 
    ignoreBuildErrors: false,
  },
  
  experimental: {
    scrollRestoration: true,
    optimizePackageImports: [
      "lucide-react", 
      "date-fns", 
      "clsx", 
      "tailwind-merge", 
      "framer-motion",
      "@/components",
      "@/lib"
    ],
    optimizeCss: true,
    // REMOVED: optimizeFonts is not valid in Next.js 16
    // Font optimization is automatic in Next.js 16 via next/font
  },
  
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**", pathname: "**" }
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" }
        ],
      },
    ];
  },
  
  async redirects() {
    return [
      { source: '/app/strategy/:slug', destination: '/strategy/:slug', permanent: true },
      { source: '/:path+/', destination: '/:path+', permanent: true },
    ];
  },
  
  webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ...buildBrowserFallbacks(),
    };
    
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
        },
      },
    };
  }
  
  // ✅ Silence verbose cache serialization warnings
  config.infrastructureLogging = {
    level: 'error',
  };
  
  return config;
  },
  
  output: 'standalone',
  
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
};

// --- CONTENTLAYER WRAPPER ---
let finalConfig = nextConfig;

try {
  const { withContentlayer } = require("next-contentlayer2");
  finalConfig = withContentlayer(nextConfig);
  console.log("✅ Contentlayer 2 Integrated");
} catch (e1) {
  try {
    const { withContentlayer } = require("next-contentlayer");
    finalConfig = withContentlayer(nextConfig);
    console.log("✅ Contentlayer (Legacy) Integrated");
  } catch (e2) {
    console.warn("⚠️ Contentlayer not found. Building without content processing.");
  }
}

export default finalConfig;