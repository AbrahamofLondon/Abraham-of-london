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
  swcMinify: true,

  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverComponentsExternalPackages: ["@prisma/client"],
    serverActions: true,
    turbo: {
      rules: {
        "*.mdx": ["@mdx-js/loader"],
      },
    },
  },

  serverExternalPackages: [
    "@prisma/client",
    "contentlayer2",
    "next-contentlayer2",
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
  },

  httpAgentOptions: {
    keepAlive: true,
  },

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    config.module.exprContextCritical = false;

    // 🚀 IMPORTANT: prevent large MDX bundling into client
    if (!isServer) {
      config.module.rules.push({
        test: /\.mdx?$/,
        include: [path.resolve(__dirname, "content")],
        use: "null-loader",
      });
    }

    return config;
  },

  headers: async () => [
    {
      source: "/api/:path*",
      headers: [
        { key: "Cache-Control", value: "no-store" },
      ],
    },
    {
      source: "/static/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default withContentlayer(nextConfig);