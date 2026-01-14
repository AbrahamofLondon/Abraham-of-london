// next.config.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import("next").NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  // Prefer runtime env vars over baking timestamps into next.config
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
      {
        source: "/workshop/purpose-pyramid",
        destination: "/workshops/purpose-pyramid",
        permanent: true,
      },
      {
        source: "/workshop/decision-matrix",
        destination: "/workshops/decision-matrix",
        permanent: true,
      },
      {
        source: "/workshop/legacy-canvas",
        destination: "/workshops/legacy-canvas",
        permanent: true,
      },
      {
        source: "/workshops/purpose-pyramid-workshop",
        destination: "/workshops/purpose-pyramid",
        permanent: true,
      },
      {
        source: "/workshops/decision-matrix-workshop",
        destination: "/workshops/decision-matrix",
        permanent: true,
      },
      {
        source: "/workshops/legacy-canvas-workshop",
        destination: "/workshops/legacy-canvas",
        permanent: true,
      },

      // Resource redirects
      {
        source: "/resources/leadership-standards",
        destination: "/resources/leadership-standards-blueprint",
        permanent: true,
      },
      {
        source: "/resources/purpose-pyramid-guide",
        destination: "/resources/purpose-pyramid",
        permanent: true,
      },
      {
        source: "/resources/legacy-framework",
        destination: "/resources/legacy-canvas",
        permanent: true,
      },

      // PDF download redirects
      {
        source: "/downloads/purpose-pyramid-worksheet-fillable.pdf",
        destination: "/downloads/purpose-pyramid.pdf",
        permanent: true,
      },
      {
        source: "/downloads/decision-matrix-worksheet-fillable.pdf",
        destination: "/downloads/decision-matrix.pdf",
        permanent: true,
      },
      {
        source: "/downloads/legacy-canvas-worksheet-fillable.pdf",
        destination: "/downloads/legacy-canvas.pdf",
        permanent: true,
      },
      {
        source: "/public/downloads/purpose-pyramid.pdf",
        destination: "/downloads/purpose-pyramid.pdf",
        permanent: true,
      },
      {
        source: "/public/downloads/decision-matrix.pdf",
        destination: "/downloads/decision-matrix.pdf",
        permanent: true,
      },
      {
        source: "/public/downloads/legacy-canvas.pdf",
        destination: "/downloads/legacy-canvas.pdf",
        permanent: true,
      },

      // Canonical
      { source: "/index.html", destination: "/", permanent: true },

      // Pages
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/get-in-touch", destination: "/contact", permanent: true },
      {
        source: "/services/coaching",
        destination: "/services/executive-coaching",
        permanent: true,
      },
      {
        source: "/services/consulting",
        destination: "/services/leadership-development",
        permanent: true,
      },

      // Content aliases
      { source: "/blog/:slug", destination: "/insights/:slug", permanent: true },
      {
        source: "/articles/:slug",
        destination: "/insights/:slug",
        permanent: true,
      },
      { source: "/news/:slug", destination: "/insights/:slug", permanent: true },

      // Download alias (destination is a page route, not a pdf file)
      {
        source: "/downloads/leadership-standards-blueprint.pdf",
        destination: "/downloads/leadership-standards-blueprint",
        permanent: true,
      },
    ];

    return redirects.filter(
      (r) => typeof r.destination === "string" && r.destination.trim() !== ""
    );
  },

  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    // NOTE: CSP must be a set of full directives. Your previous version mixed sources
    // as separate array items, which produces invalid CSP.
    const csp = [
      "default-src 'self'",
      [
        "script-src 'self'",
        // If you can remove these two later, do it.
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://www.google.com",
        "https://www.gstatic.com",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://app.netlify.com",
        "https://*.netlify.app",
        "https://*.netlify.com",
      ].join(" "),
      [
        "connect-src 'self'",
        "https://www.google.com",
        "https://www.google-analytics.com",
        "https://*.netlify.app",
        "https://*.netlify.com",
        "https://api.netlify.com",
        "https://*.auth0.com",
        "wss://*.netlify.app",
      ].join(" "),
      ["img-src 'self'", "data:", "blob:", "https:"].join(" "),
      ["style-src 'self'", "'unsafe-inline'", "https://fonts.googleapis.com"].join(
        " "
      ),
      ["font-src 'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com"].join(
        " "
      ),
      [
        "frame-src 'self'",
        "https://www.google.com",
        "https://app.netlify.com",
        "https://identity.netlify.com",
      ].join(" "),
      ["media-src 'self'", "data:", "https:"].join(" "),
      "object-src 'none'",
      "base-uri 'self'",
      ["form-action 'self'", "https://*.netlify.app", "https://*.netlify.com"].join(
        " "
      ),
      "frame-ancestors 'none'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    return [
      // Static font cache
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },

      // Next static
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

      // Direct PDF hits (if any remain)
      {
        source: "/downloads/:path*.pdf",
        headers: [
          { key: "Content-Type", value: "application/pdf" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },

      // Public downloadable assets cache
      {
        source: "/assets/downloads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

      // Global security headers
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Cache-Control", value: "no-store" },
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
          { key: "Permissions-Policy", value: [
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

          // Netlify headers: only set if present (empty values are noise)
          ...(process.env.NETLIFY_SITE_ID
            ? [{ key: "X-Netlify-ID", value: process.env.NETLIFY_SITE_ID }]
            : []),
          ...(process.env.NETLIFY_EDGE_HANDLER
            ? [{ key: "X-Netlify-Edge", value: process.env.NETLIFY_EDGE_HANDLER }]
            : []),
        ],
      },
    ];
  },

  webpack: (config, { isServer, dev, webpack }) => {
    // Ignore binary assets if they ever get referenced by mistake
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(pdf|pptx|docx|xlsx|od[tsp])$/i,
      })
    );

    // Browser fallbacks (only if something tries to drag Node built-ins client-side)
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

    // Windows dev watch sanity (prevents EPERM / churn)
    if (process.platform === "win32" && dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          "**/node_modules/**",
          "**/.next/**",

          // Public binary assets
          "**/public/assets/downloads/**",
          "**/public/downloads/**",
          "**/public/assets/vault/**",

          // Private vault (should never be watched by Next)
          "**/private/**",

          // Common binaries anywhere
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