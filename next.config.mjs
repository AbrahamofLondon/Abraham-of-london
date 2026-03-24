import { withContentlayer } from "next-contentlayer2";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  outputFileTracingIncludes: {
    "/api/assets/*": ["./vault/**/*"],
    "/api/dl/*": ["./vault/**/*"],
  },

  serverExternalPackages: ["@prisma/client", "contentlayer2", "next-contentlayer2"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.abrahamoflondon.org" },
      { protocol: "https", hostname: "abrahamoflondon.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };

    config.module.exprContextCritical = false;

    config.module.rules.push({
      test: /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf)$/i,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });

    if (!isServer) {
      config.module.rules.push({
        test: /\.(js|jsx|ts|tsx|md|mdx)$/,
        include: [path.resolve(__dirname, "private")],
        use: "null-loader",
      });
    }

    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        http2: false,
        module: false,
        "markdown-wasm": false,
        "file:/": false,
      };
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/vault/downloads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/static/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withContentlayer(nextConfig);