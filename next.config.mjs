// next.config.mjs — ABRAHAM OF LONDON (NEXT-16-STABLE, CONTENTLAYER2-COMPATIBLE)
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

  // ✅ [STABILIZATION]: Explicitly disable Turbopack for MDX/Contentlayer compatibility
  // This satisfies the Next.js 16 requirement for custom webpack configs.
  // turbopack: {}, // Uncomment if you move to Turbopack later

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
  },

  transpilePackages: ["framer-motion"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "abrahamoflondon.org", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  webpack: (config, { isServer }) => {
    // Standardize alias
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    // 🏛️ [INSTITUTIONAL PROTECTION]: 
    // Prevent Node internals from leaking into the client bundle.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        module: false,
      };
    }

    config.infrastructureLogging = { level: "error" };
    return config;
  },

  distDir: ".next",
};

// ✅ Apply Contentlayer2 wrapper
export default withContentlayer(nextConfig);