// next.config.mjs
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
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    // FIX: Add all quality values used in your Image components
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

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          maxSize: 244000,
        },
      };
    }

    if (!isServer) {
      config.module.rules.push({
        test: /\.mdx?$/,
        include: [path.resolve(__dirname, "content")],
        use: "null-loader",
      });
    }

    if (dev) {
      config.module.rules.push({
        test: /\.map$/,
        use: "null-loader",
      });
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default withContentlayer(nextConfig);