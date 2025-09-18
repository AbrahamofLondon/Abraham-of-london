// next.config.mjs
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const relax = process.env.CI_LAX === "1";
const isAnalyze = process.env.ANALYZE === "true";
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || "";

/* -------------------- MDX -------------------- */
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [remarkGfm] },
});

/* --------------- Base Next config ------------- */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,
  assetPrefix: assetPrefix || undefined,

  // CI-only relax (keeps local strict)
  eslint: { ignoreDuringBuilds: relax },
  typescript: { ignoreBuildErrors: relax },

  images: {
    formats: ["image/avif", "image/webp"],

    // CSP specifically for Next/Image responses (tightens inline SVG/script risk)
    contentSecurityPolicy:
      "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self'; " +
      "script-src 'none'; style-src 'unsafe-inline'",

    // DO NOT allow arbitrary SVG rendering via <Image/> — safer path.
    // For inline icons/components, import *.svg as React components via SVGR (see webpack below).
    // For file-URL usage, append `?url` to the import.
    remotePatterns: [
      { protocol: "https", hostname: "abraham-of-london.netlify.app" },
      { protocol: "https", hostname: "abrahamoflondon.org" },
      { protocol: "https", hostname: "www.abrahamoflondon.org" },
      // add future CDNs here, e.g. { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  experimental: {
    // Cuts bundle size from large libs
    optimizePackageImports: ["framer-motion", "lucide-react", "date-fns"],
  },

  // Fine-grained module tweaks
  modularizeImports: {
    "lucide-react": { transform: "lucide-react/dist/esm/icons/{{member}}" },
    "date-fns": { transform: "date-fns/{{member}}" },
  },

  // SVGR for inline SVG components; keep file-loader via '?url' when needed.
  webpack: (config, { isServer }) => {
    // Handle *.svg as React components by default
    config.module.rules.push({
      test: /\.svg$/i,
      resourceQuery: { not: [/url/] }, // *.svg?url => file url
      use: [
        {
          loader: require.resolve("@svgr/webpack"),
          options: {
            prettier: false,
            svgo: true,
            titleProp: true,
            ref: true,
            svgoConfig: {
              plugins: [
                { name: "removeViewBox", active: false },
                { name: "cleanupIDs", active: true },
              ],
            },
          },
        },
      ],
    });

    // Keep ability to import raw URLs: import iconUrl from './icon.svg?url'
    config.module.rules.push({
      test: /\.svg$/i,
      resourceQuery: /url/,
      type: "asset/resource",
    });

    return config;
  },
};

/* --------- Optional bundle analyzer ---------- */
let withAnalyzer = (cfg) => cfg;
if (isAnalyze) {
  try {
    const analyzer =
      require("@next/bundle-analyzer").default ?? require("@next/bundle-analyzer");
    withAnalyzer = analyzer({ enabled: true });
  } catch {
    // analyzer not installed — skip silently
  }
}

/* -------------------- Export ------------------ */
export default withAnalyzer(withMDX(nextConfig));
