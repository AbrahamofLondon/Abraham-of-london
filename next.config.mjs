/**
 * next.config.mjs — Netlify-aligned build configuration
 */

import path from "path";
import { fileURLToPath } from "url";
import { withContentlayer } from "next-contentlayer2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  productionBrowserSourceMaps: false,

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "date-fns",
      "lodash-es",
    ],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  serverExternalPackages: [
    "@prisma/client",
    "contentlayer2",
    "next-contentlayer2",
    "@react-pdf/renderer",
    "canvas",
    "jsdom",
  ],

  outputFileTracingRoot: process.cwd(),
  outputFileTracingExcludes: {
    "*": [
      "./.git/**",
      "./.contentlayer/.cache/**",
      "./node_modules/.cache/**",
      "./node_modules/typescript/**",
      "./node_modules/sass/**",
      "./node_modules/@esbuild/**",
      "./.contentlayer/generated/**/_index.json",
      "./private_storage/**",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    qualities: [75, 82, 85],
  },

  httpAgentOptions: {
    keepAlive: true,
  },

  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    config.module = {
      ...config.module,
      exprContextCritical: false,
      unknownContextCritical: false,
    };

    config.infrastructureLogging = {
      level: "error",
    };

    if (config.cache && config.cache.type === "filesystem") {
      config.cache.maxMemoryGenerations = 1;
    }

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...(config.optimization?.splitChunks || {}),
          chunks: "all",
          maxSize: 244000,
        },
      };
    }

    return config;
  },

  async redirects() {
    return [
      // /pricing previously served the admin EventPriceManager control page
      // to public visitors (linked from the blog sidebar "Upgrade Access" CTA).
      // Temporary 302 redirect to the flagship paid product. Blog sidebar CTA
      // was also updated in the same commit to link directly to Executive
      // Reporting with a proper label.
      { source: "/pricing", destination: "/diagnostics/executive-reporting", permanent: false },
    ];
  },
};

export default withContentlayer(nextConfig);