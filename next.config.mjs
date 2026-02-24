// next.config.mjs — ABRAHAM OF LONDON (NETLIFY-STABLE, ASSET-SAFE, HYBRID ROUTING FRIENDLY)
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

  // ✅ Netlify automatically handles the build output; standalone is unnecessary here.
  // output: "standalone",

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
    // Ensure Node.js internals never leak into the browser bundle.
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

// ✅ ESM-Native Wrapper application using next-contentlayer2
export default withContentlayer(nextConfig);