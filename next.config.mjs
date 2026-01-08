// next.config.mjs
import { withContentlayer } from "next-contentlayer2";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Silence build friction
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  env: {
    CONTENTLAYER_DISABLE_WARNINGS: "true",
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  webpack: (config, { isServer, webpack }) => {
    // Prevent ioredis from ever being pulled into client bundles
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^ioredis$/,
        })
      );
    }

    // Reduce noise from contentlayer internals
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /contentlayer/ },
      { module: /@contentlayer/ },
    ];

    // Windows watcher sanity
    if (process.platform === "win32") {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/.contentlayer/**", "**/.next/**"],
      };
    }

    return config;
  },

  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "pdfkit", "sharp", "bcrypt"],
  },
};

export default withContentlayer(nextConfig);