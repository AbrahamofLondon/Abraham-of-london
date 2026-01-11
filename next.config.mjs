/* next.config.mjs - FIXED REDIRECTS */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  env: {
    CONTENTLAYER_DISABLE_WARNINGS: "true",
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || "production",
    NEXT_PUBLIC_SITE_URL:
      process.env.NODE_ENV === "production"
        ? "https://www.abrahamoflondon.org"
        : "http://localhost:3000",
    BUILD_TIMESTAMP: new Date().toISOString(),
  },

  async redirects() {
    const redirects = [
      // Workshop redirects
      {
        source: '/workshop/purpose-pyramid',
        destination: '/workshops/purpose-pyramid',
        permanent: true,
      },
      {
        source: '/workshop/decision-matrix',
        destination: '/workshops/decision-matrix',
        permanent: true,
      },
      {
        source: '/workshop/legacy-canvas',
        destination: '/workshops/legacy-canvas',
        permanent: true,
      },
      {
        source: '/workshops/purpose-pyramid-workshop',
        destination: '/workshops/purpose-pyramid',
        permanent: true,
      },
      {
        source: '/workshops/decision-matrix-workshop',
        destination: '/workshops/decision-matrix',
        permanent: true,
      },
      {
        source: '/workshops/legacy-canvas-workshop',
        destination: '/workshops/legacy-canvas',
        permanent: true,
      },
      
      // Resource redirects
      {
        source: '/resources/leadership-standards',
        destination: '/resources/leadership-standards-blueprint',
        permanent: true,
      },
      {
        source: '/resources/purpose-pyramid-guide',
        destination: '/resources/purpose-pyramid',
        permanent: true,
      },
      {
        source: '/resources/legacy-framework',
        destination: '/resources/legacy-canvas',
        permanent: true,
      },
      
      // PDF download redirects
      {
        source: '/downloads/purpose-pyramid-worksheet-fillable.pdf',
        destination: '/downloads/purpose-pyramid.pdf',
        permanent: true,
      },
      {
        source: '/downloads/decision-matrix-worksheet-fillable.pdf',
        destination: '/downloads/decision-matrix.pdf',
        permanent: true,
      },
      {
        source: '/downloads/legacy-canvas-worksheet-fillable.pdf',
        destination: '/downloads/legacy-canvas.pdf',
        permanent: true,
      },
      {
        source: '/public/downloads/purpose-pyramid.pdf',
        destination: '/downloads/purpose-pyramid.pdf',
        permanent: true,
      },
      {
        source: '/public/downloads/decision-matrix.pdf',
        destination: '/downloads/decision-matrix.pdf',
        permanent: true,
      },
      {
        source: '/public/downloads/legacy-canvas.pdf',
        destination: '/downloads/legacy-canvas.pdf',
        permanent: true,
      },
      
      // Domain canonicalization
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      
      // Page redirects
      {
        source: '/about-us',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/contact-us',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/get-in-touch',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/services/coaching',
        destination: '/services/executive-coaching',
        permanent: true,
      },
      {
        source: '/services/consulting',
        destination: '/services/leadership-development',
        permanent: true,
      },
    ];

    // Only add redirects if destinations exist or are valid
    const validRedirects = redirects.filter(redirect => 
      redirect.destination && 
      typeof redirect.destination === 'string' && 
      redirect.destination.trim() !== ''
    );

    // Add blog/content redirects
    validRedirects.push(
      {
        source: '/blog/:slug',
        destination: '/insights/:slug',
        permanent: true,
      },
      {
        source: '/articles/:slug',
        destination: '/insights/:slug',
        permanent: true,
      },
      {
        source: '/news/:slug',
        destination: '/insights/:slug',
        permanent: true,
      }
    );

    // Add download alias
    validRedirects.push({
      source: '/downloads/leadership-standards-blueprint.pdf',
      destination: '/downloads/leadership-standards-blueprint',
      permanent: true,
    });

    return validRedirects;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },

  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/downloads/:path*.pdf",
        headers: [
          {
            key: "Content-Type",
            value: "application/pdf",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/assets/downloads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "clsx",
      "tailwind-merge",
    ],
  },

  transpilePackages: [
    "lucide-react",
    "date-fns",
    "clsx",
    "tailwind-merge",
  ],

  webpack: (config, { isServer, dev, webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(pdf|pptx|docx|xlsx|od[tsp])$/i,
        contextRegExp: /[\\/]public[\\/](downloads|assets[\\/]downloads)[\\/]/,
      })
    );

    if (process.platform === "win32") {
      if (dev) {
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
    }

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

    return config;
  },
};

async function applyContentlayer(config) {
  if (process.env.NODE_ENV === "production" && !process.env.ENABLE_CONTENTLAYER_PROD) {
    console.log("⚡ Contentlayer disabled in production");
    return config;
  }

  try {
    const { withContentlayer } = await import("next-contentlayer2");
    console.log("✅ Contentlayer enabled");
    return withContentlayer(config);
  } catch (error) {
    console.warn("⚠️ Contentlayer not available:", error.message);
    return config;
  }
}

export default applyContentlayer(nextConfig);
