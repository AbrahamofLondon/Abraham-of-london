// next.config.mjs
import path from "path";
import { fileURLToPath } from "url";
import { withContentlayer } from "next-contentlayer2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isNetlify = process.env.NETLIFY === "true";
const isCI = process.env.CI === "true" || isNetlify;
const isWindows = process.platform === "win32";

// Apply Windows fixes early if needed
if (isWindows && !process.env.DISABLE_WINDOWS_FIX) {
  try {
    const { applyWindowsFix } = await import("./patches/windows-fix.mjs");
  } catch (e) {
    console.warn("⚠️ Windows fix patch not found, continuing...");
  }
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: false,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: isNetlify && process.env.NETLIFY_TS_IGNORE === "true",
  },
  eslint: {
    dirs: ["pages", "components", "lib", "types", "app"],
    ignoreDuringBuilds: isNetlify && process.env.NETLIFY_ESLINT_IGNORE === "true",
  },
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-R2Y3YMY8F8",
  },
  experimental: {
    esmExternals: false,
    serverComponentsExternalPackages: ['pg', 'pg-native', 'crypto'],
  },
  pageExtensions: ["tsx", "ts", "jsx", "js", "mdx", "md"],
  webpack: (config, { dev, isServer, webpack }) => {
    // Resolve aliases
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    // Fallbacks for client
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        crypto: false,
      };
    }

    /* -------------------------------------------------------------------------- */
    /* WINDOWS BINARY EXCLUSION (Vault, Downloads, PPTX, ZIP)                     */
    /* -------------------------------------------------------------------------- */
    config.module.noParse = [
      ...(config.module.noParse || []),
      /\.(pdf|xlsx?|docx?|pptx?|zip|tar|gz)$/i,
    ];

    config.module.rules.push({
      test: /\.(pdf|xlsx?|docx?|pptx?|zip|tar|gz)$/i,
      type: "asset/resource",
      generator: { emit: false },
    });

    // WINDOWS-SPECIFIC FIXES
    if (isWindows) {
      console.log("🔧 Applying Windows-specific Webpack optimizations...");
      
      // Ignore Contentlayer warnings on Windows
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /node_modules[\\/]contentlayer2/ },
        { module: /node_modules[\\/]mdast-util-mdx-jsx/ },
        { module: /node_modules[\\/]mdast-util-to-markdown/ },
        { module: /node_modules[\\/]@contentlayer2/ },
        { message: /Can't resolve/ },
      ];
      
      // Fix for Windows path issues in Contentlayer
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /\.contentlayer[\\/]generated[\\/]/,
          (resource) => {
            resource.request = resource.request.replace(/\\/g, '/');
          }
        )
      );
      
      // Increase memory limits for Windows
      config.performance = {
        ...config.performance,
        maxAssetSize: 5 * 1024 * 1024, // 5MB
        maxEntrypointSize: 5 * 1024 * 1024, // 5MB
      };
    }

    // Watch options
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/.contentlayer/**',
        path.resolve(__dirname, 'public/assets/vault'),
        path.resolve(__dirname, 'public/assets/downloads'),
        path.resolve(__dirname, 'public/downloads'),
      ],
    };

    // Snapshot configuration
    if (config.snapshot) {
      config.snapshot = {
        ...config.snapshot,
        managedPaths: [
          ...(config.snapshot.managedPaths || []),
          path.resolve(__dirname, 'node_modules'),
        ],
        immutablePaths: [
          ...(config.snapshot.immutablePaths || []),
          path.resolve(__dirname, 'public/assets/vault'),
          path.resolve(__dirname, 'public/assets/downloads'),
          path.resolve(__dirname, 'public/downloads'),
        ],
      };
    }

    // Cache configuration for CI
    if (config.cache && typeof config.cache === "object" && isCI) {
      config.cache = {
        ...config.cache,
        name: `webpack-cache-${process.env.NODE_ENV || "prod"}`,
        version: process.env.BUILD_ID || "1",
      };
    }

    // Fix for pg and other native modules
    config.externals = [
      ...(config.externals || []),
      ({ context, request }, callback) => {
        if (/^pg-native$/.test(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ];

    return config;
  },
};

// Apply Contentlayer with Windows fallback
const configWithContentlayer = withContentlayer(nextConfig);

// Export with Windows detection
export default process.platform === "win32" 
  ? async (...args) => {
      // Windows-specific initialization
      console.log("🚀 Starting Abraham of London on Windows");
      
      try {
        return await configWithContentlayer(...args);
      } catch (error) {
        console.warn("⚠️ Contentlayer initialization error, continuing without it...");
        
        // Return config without Contentlayer on Windows if it fails
        const config = nextConfig;
        config.env = {
          ...config.env,
          DISABLE_CONTENTLAYER: "true",
        };
        
        return config;
      }
    }
  : configWithContentlayer;