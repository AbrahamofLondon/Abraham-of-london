// next.config.mjs
import { withContentlayer } from "next-contentlayer2";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  // ✅ Stable Production Tracing
  outputFileTracingIncludes: {
    "/api/assets/*": ["./vault/**/*"],
    "/api/dl/*": ["./vault/**/*"],
  },

  // ✅ Force Prisma and Contentlayer to remain external
  serverExternalPackages: ["@prisma/client", "contentlayer2"],

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: [
      "date-fns", 
      "clsx", 
      "tailwind-merge", 
      "framer-motion", 
      "lucide-react"
    ],
  },

  transpilePackages: ["framer-motion"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.abrahamoflondon.org" },
      { protocol: "https", hostname: "abrahamoflondon.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };

    // ✅ CRITICAL: Prevent webpack from trying to process files in private/vault
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/private/**',
        '**/vault/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/*.pptx',
        '**/*.pdf',
        '**/*.docx',
        '**/*.xlsx',
        '**/*.zip',
      ],
    };

    // ✅ Handle binary files as assets
    config.module.rules.push({
      test: /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]'
      }
    });

    // ✅ Explicitly exclude private directory from being processed by loaders
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx|md|mdx)$/,
      include: [path.resolve(__dirname, 'private')],
      use: 'null-loader', // This loader does nothing
    });

    // Client-side polyfills for process/fs
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        process: require.resolve("process/browser"),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
        })
      );
    }

    return config;
  },

  // ✅ Add headers to allow PDF access
  async headers() {
    return [
      {
        source: '/vault/downloads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withContentlayer(nextConfig);