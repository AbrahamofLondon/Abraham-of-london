// next.config.mjs - SIMPLIFIED VERSION
import { withContentlayer } from "next-contentlayer2";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,

  // Silence build friction
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    minimumCacheTTL: 60,
  },

  // Webpack configuration - SIMPLIFIED
  webpack: (config, { isServer, dev }) => {
    // Ignore warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /contentlayer/ },
      { module: /@contentlayer/ },
    ];

    // Windows watcher optimization
    if (process.platform === "win32") {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/.contentlayer/**", "**/.next/**", "**/node_modules/**"],
      };
    }

    return config;
  },

  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      'pdfkit',
      'sharp',
      'bcrypt',
    ],
  },

  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

// Apply ContentLayer wrapper
export default withContentlayer(nextConfig);