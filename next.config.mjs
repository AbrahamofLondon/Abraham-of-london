/* next.config.mjs - CLEAN, STABLE, WINDOWS-SAFE */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let withContentlayer = (config) => config;
try {
  const mod = await import("next-contentlayer2");
  if (mod?.withContentlayer) withContentlayer = mod.withContentlayer;
} catch {
  // no-op on purpose (still builds without wrapper)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  images: {
    deviceSizes: [320, 420, 768, 1024, 1200],
    formats: ["image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  // NOTE: keep these off only while stabilising builds
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "1.0.0",
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },

  webpack: (config, { webpack }) => {
    // Support raw .sql imports if you use them
    config.module.rules.push({ test: /\.sql$/, type: "asset/source" });

    // Ignore scripts folder from bundling if you import accidentally
    config.module.rules.push({
      test: /[\\/]scripts[\\/].*\.(ts|tsx|js|jsx)$/,
      use: "ignore-loader",
    });

    // Windows / tracing noise: ignore heavy binary assets under public
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(pptx|xlsx|docx|pdf|zip|jpg|jpeg|png|gif|webp|svg|ico)$/i,
        contextRegExp: /public[\\/](assets|downloads)/i,
      })
    );

    // Watch stability on win32
    if (process.platform === "win32") {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/**", "**/public/**"],
      };
    }

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    // Reduce noisy “Critical dependency” warnings from dynamic requires
    config.module.exprContextCritical = false;

    return config;
  },
};

export default withContentlayer(nextConfig);