/** @type {import("next").NextConfig} */
import path from "node:path";
import { withContentlayer } from "next-contentlayer2";

const nextConfig = {
  reactStrictMode: true,

  // Canonical routing: no trailing slash
  trailingSlash: false,

  // Netlify + Next Image: keep optimized in prod unless you have a hard reason
  images: {
    // If you truly need unoptimized (static export), keep true. Otherwise set false.
    // For Netlify + plugin-nextjs, optimized is fine.
    unoptimized: false,

    dangerouslyAllowSVG: true,

    // NOTE: Next does NOT accept hostname: "**"
    // Allow any HTTPS remote image by leaving remotePatterns open-ended is not supported.
    // Use a permissive but valid pattern instead:
    remotePatterns: [{ protocol: "https", hostname: "*", pathname: "/**" }],

    formats: ["image/avif", "image/webp"],
  },

  // For production robustness: do NOT ship with these enabled long term.
  // But I’m leaving them as you had them so you can get a deploy out first.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  webpack: (config, { isServer }) => {
    // Respect tsconfig paths, but ensure "@" resolves correctly and consistently
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(process.cwd()),
    };

    // Don't stub Node core modules unless you are importing server-only code in client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default withContentlayer(nextConfig);