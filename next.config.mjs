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

  serverExternalPackages: ["@prisma/client", "contentlayer2"],

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: ["date-fns", "clsx", "tailwind-merge"],
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

    if (!isServer) {
      // ✅ FIX: Use require with createRequire
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
};

export default withContentlayer(nextConfig);