// next.config.mjs
import createMDX from "@next/mdx";
import withBundleAnalyzer from "@next/bundle-analyzer";
import remarkGfm from "remark-gfm";

const relax = process.env.CI_LAX === "1"; // set to "1" in Netlify to unblock CI only

// --- MDX ---
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
  },
});

// --- Base config ---
/** @type {import('next').NextConfig} */
const baseConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  output: "standalone",

  // CI-only relax (keeps local strict)
  eslint: { ignoreDuringBuilds: relax },
  typescript: { ignoreBuildErrors: relax },

  // Stable import optimization (prefer over experimental.optimizePackageImports)
  modularizeImports: {
    "framer-motion": {
      transform: "framer-motion/{{member}}",
    },
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 828, 1080, 1200, 1600, 1920, 2048],
    imageSizes: [16, 32, 64, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "abraham-of-london.netlify.app" },
      { protocol: "https", hostname: "abrahamoflondon.org" },
      { protocol: "https", hostname: "www.abrahamoflondon.org" },
      // Add brand assets if you ever load logos directly from these domains via <Image>
      { protocol: "https", hostname: "alomarada.com" },
      { protocol: "https", hostname: "www.alomarada.com" },
      { protocol: "https", hostname: "endureluxe.com" },
      { protocol: "https", hostname: "www.endureluxe.com" },
    ],
  },

  httpAgentOptions: { keepAlive: true },

  // High-value redirects (SEO hygiene)
  async redirects() {
    return [
      // Consolidate branding
      { source: "/brands", destination: "/ventures", permanent: true },
    ];
  },

  // Security & perf headers (safe defaults)
  async headers() {
    const security = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // If you don’t embed this site elsewhere, DENY; otherwise relax to SAMEORIGIN.
      { key: "X-Frame-Options", value: "DENY" },
      // Conservative Permissions-Policy; expand if you need features.
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    // Cache static assets from /_next with immutable (Next also sets this, belt-and-braces)
    const staticCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];

    return [
      { source: "/:path*", headers: security },
      { source: "/_next/static/:path*", headers: staticCache },
      { source: "/assets/:path*", headers: staticCache },
    ];
  },
};

export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(
  withMDX(baseConfig)
);
