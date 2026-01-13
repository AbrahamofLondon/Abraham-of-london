// next.config.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import("next").NextConfig} */
const baseConfig = {
  reactStrictMode: true,

  // Prefer runtime env vars over baking timestamps into next.config
  // (BUILD_TIMESTAMP forces cache bust every build)
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
      // framer-motion is fine here, but it's not a magic fix if it's missing
      "framer-motion",
    ],
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },

  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  transpilePackages: [
    "lucide-react",
    "date-fns",
    "clsx",
    "tailwind-merge",
    "framer-motion",
  ],

  async redirects() {
    const redirects = [
      // Workshop redirects
      { source: "/workshop/purpose-pyramid", destination: "/workshops/purpose-pyramid", permanent: true },
      { source: "/workshop/decision-matrix", destination: "/workshops/decision-matrix", permanent: true },
      { source: "/workshop/legacy-canvas", destination: "/workshops/legacy-canvas", permanent: true },
      { source: "/workshops/purpose-pyramid-workshop", destination: "/workshops/purpose-pyramid", permanent: true },
      { source: "/workshops/decision-matrix-workshop", destination: "/workshops/decision-matrix", permanent: true },
      { source: "/workshops/legacy-canvas-workshop", destination: "/workshops/legacy-canvas", permanent: true },

      // Resource redirects
      { source: "/resources/leadership-standards", destination: "/resources/leadership-standards-blueprint", permanent: true },
      { source: "/resources/purpose-pyramid-guide", destination: "/resources/purpose-pyramid", permanent: true },
      { source: "/resources/legacy-framework", destination: "/resources/legacy-canvas", permanent: true },

      // PDF download redirects
      { source: "/downloads/purpose-pyramid-worksheet-fillable.pdf", destination: "/downloads/purpose-pyramid.pdf", permanent: true },
      { source: "/downloads/decision-matrix-worksheet-fillable.pdf", destination: "/downloads/decision-matrix.pdf", permanent: true },
      { source: "/downloads/legacy-canvas-worksheet-fillable.pdf", destination: "/downloads/legacy-canvas.pdf", permanent: true },
      { source: "/public/downloads/purpose-pyramid.pdf", destination: "/downloads/purpose-pyramid.pdf", permanent: true },
      { source: "/public/downloads/decision-matrix.pdf", destination: "/downloads/decision-matrix.pdf", permanent: true },
      { source: "/public/downloads/legacy-canvas.pdf", destination: "/downloads/legacy-canvas.pdf", permanent: true },

      // Canonical
      { source: "/index.html", destination: "/", permanent: true },

      // Pages
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/get-in-touch", destination: "/contact", permanent: true },
      { source: "/services/coaching", destination: "/services/executive-coaching", permanent: true },
      { source: "/services/consulting", destination: "/services/leadership-development", permanent: true },

      // Content aliases
      { source: "/blog/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/articles/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/news/:slug", destination: "/insights/:slug", permanent: true },

      // Download alias (note: destination is a page route, not a pdf file)
      { source: "/downloads/leadership-standards-blueprint.pdf", destination: "/downloads/leadership-standards-blueprint", permanent: true },
    ];

    return redirects.filter(r => typeof r.destination === "string" && r.destination.trim() !== "");
  },

  async headers() {
    // Netlify production-safe CSP policy
    const cspDirectives = [
      // Default sources
      "default-src 'self'",
      
      // Script sources
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Add common analytics and external scripts
      "https://www.google.com",
      "https://www.gstatic.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      // Netlify specific
      "https://app.netlify.com",
      "https://*.netlify.app",
      "https://*.netlify.com",
      
      // Connect sources (for API calls, WebSockets, etc.)
      "connect-src 'self'",
      "https://www.google.com",
      "https://www.google-analytics.com",
      // Netlify forms and functions
      "https://*.netlify.app",
      "https://*.netlify.com",
      "https://api.netlify.com",
      // Netlify Identity if you use it
      "https://*.auth0.com",
      "wss://*.netlify.app",
      
      // Image sources
      "img-src 'self' data: blob: https:",
      "https:",
      "data:",
      // Netlify large media
      "https://images.ctfassets.net",
      "https://*.cloudinary.com",
      
      // Style sources
      "style-src 'self' 'unsafe-inline'",
      // Allow Google Fonts if you use them
      "https://fonts.googleapis.com",
      // Allow Font Awesome if you use it
      "https://cdnjs.cloudflare.com",
      "https://use.fontawesome.com",
      // Allow Netlify CMS if you use it
      "https://unpkg.com",
      
      // Font sources
      "font-src 'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com",
      "https://use.fontawesome.com",
      "data:",
      
      // Frame sources
      "frame-src 'self'",
      "https://www.google.com",
      "https://app.netlify.com",
      // Netlify CMS iframe
      "https://identity.netlify.com",
      
      // Media sources (for audio/video if needed)
      "media-src 'self'",
      "https:",
      "data:",
      
      // Object sources (for Flash, Java, etc.)
      "object-src 'none'",
      
      // Base URI
      "base-uri 'self'",
      
      // Form action
      "form-action 'self'",
      "https://*.netlify.app",
      "https://*.netlify.com",
      
      // Frame ancestors
      "frame-ancestors 'none'",
      
      // Upgrading insecure requests (only in production)
      ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
    ];

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
        source: "/downloads/:path*.pdf",
        headers: [
          { key: "Content-Type", value: "application/pdf" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/assets/downloads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspDirectives.join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Add HSTS for production
          ...(process.env.NODE_ENV === "production" ? [
            { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }
          ] : []),
          // Netlify specific headers
          { key: "X-Netlify-ID", value: process.env.NETLIFY_SITE_ID || "" },
          { key: "X-Netlify-Edge", value: process.env.NETLIFY_EDGE_HANDLER || "" },
          // Permissions Policy
          {
            key: "Permissions-Policy",
            value: [
              "accelerometer=()",
              "ambient-light-sensor=()",
              "autoplay=()",
              "battery=()",
              "camera=()",
              "display-capture=()",
              "document-domain=()",
              "encrypted-media=()",
              "execution-while-not-rendered=()",
              "execution-while-out-of-viewport=()",
              "fullscreen=()",
              "gamepad=()",
              "geolocation=()",
              "gyroscope=()",
              "layout-animations=()",
              "legacy-image-formats=()",
              "magnetometer=()",
              "microphone=()",
              "midi=()",
              "navigation-override=()",
              "oversized-images=()",
              "payment=()",
              "picture-in-picture=()",
              "publickey-credentials-get=()",
              "screen-wake-lock=()",
              "sync-xhr=()",
              "usb=()",
              "web-share=()",
              "xr-spatial-tracking=()",
              "clipboard-read=(self)",
              "clipboard-write=(self)",
            ].join(", ")
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer, dev, webpack }) => {
    // DO NOT externalize framer-motion. If it exists, bundle it.
    // If it doesn't exist, install it.

    // Ignore Contentlayer dynamic generated imports where they appear in compat layers
    
    // Ignore binary docs in the public downloads folders (prevents accidental bundling)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(pdf|pptx|docx|xlsx|od[tsp])$/i,
        contextRegExp: /[\\/]public[\\/](downloads|assets[\\/]downloads)[\\/]/,
      })
    );

    // Optional fallbacks if you truly have browser-side imports that drag node built-ins.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url/"),
        util: require.resolve("util/"),
        path: require.resolve("path-browserify"),
        os: require.resolve("os-browserify"),
      };
    }

    // Windows dev watch sanity
    if (process.platform === "win32" && dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/public/assets/downloads/**",
          "**/public/downloads/**",
          "**/*.pdf",
          "**/*.pptx",
          "**/*.docx",
          "**/*.xlsx",
          "**/Thumbs.db",
          "**/desktop.ini",
        ],
      };
    }

    return config;
  },
};

async function withOptionalContentlayer(config) {
  // Prefer Contentlayer v2 if available
  try {
    const mod = await import("next-contentlayer2");
    if (typeof mod.withContentlayer === "function") return mod.withContentlayer(config);
    return config;
  } catch {
    // Fallback: if contentlayer v1 is present
    try {
      const mod = await import("contentlayer");
      if (typeof mod.withContentlayer === "function") return mod.withContentlayer(config);
      return config;
    } catch {
      return config;
    }
  }
}

export default withOptionalContentlayer(baseConfig);