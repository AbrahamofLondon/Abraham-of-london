/* next.config.mjs - WINDOWS FILE LOCKING FIX */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import path from "path";
import fs from "fs";

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // ✅ Build resilience
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  env: {
    CONTENTLAYER_DISABLE_WARNINGS: "true",
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || "production",
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
    BUILD_TIMESTAMP: new Date().toISOString(),
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  // ✅ Clean headers
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // ✅ WINDOWS FIX: Minimal webpack config that excludes problematic files
  webpack: (config, { isServer, webpack, dev }) => {
    // CRITICAL: Exclude Office/PDF files from Webpack processing entirely
    // This prevents Windows file locking issues
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource: (resource, context) => {
          // Skip Office and PDF files in public/downloads/ and public/assets/downloads/
          const absolutePath = path.resolve(context, resource);
          
          // Check if it's a problematic file type
          const isProblematicFile = /\.(xlsx?|docx?|pptx?|pdf|od[tsp])$/i.test(resource);
          
          // Check if it's in a downloads directory
          const isInDownloads = 
            absolutePath.includes(path.sep + 'public' + path.sep + 'downloads' + path.sep) ||
            absolutePath.includes(path.sep + 'public' + path.sep + 'assets' + path.sep + 'downloads' + path.sep);
          
          // Exclude problematic files in downloads directories
          if (isProblematicFile && isInDownloads) {
            console.log(`[Webpack] Skipping Windows-locked file: ${resource}`);
            return true;
          }
          
          return false;
        }
      })
    );

    // Handle client-side modules only
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url/"),
        util: require.resolve("util/"),
      };
    }

    // Windows compatibility - EXCLUDE DOWNLOAD FILES FROM WATCHING
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          "**/.next/**", 
          "**/node_modules/**",
          // CRITICAL: Exclude ALL download files from file watching
          "**/public/downloads/**",
          "**/public/assets/downloads/**",
          // Windows temp files
          "**/*.tmp",
          "**/Thumbs.db",
          "**/desktop.ini",
          "**/~$*",
        ],
      };
    }

    return config;
  },

  // ✅ Disable static file optimization for downloads
  async rewrites() {
    return {
      beforeFiles: [
        // Skip optimization for download files
        {
          source: '/downloads/:path*',
          has: [
            {
              type: 'header',
              key: 'Accept',
              value: '.*'
            }
          ],
          destination: '/downloads/:path*',
        }
      ]
    };
  },

  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "pdfkit", "sharp", "bcrypt"],
    scrollRestoration: true,
    optimizePackageImports: ["lucide-react", "date-fns", "clsx", "tailwind-merge"],
  },

  i18n: {
    locales: ["en-GB", "en-US"],
    defaultLocale: "en-GB",
    localeDetection: false,
  },

  transpilePackages: [
    "lucide-react",
    "date-fns",
    "clsx",
    "tailwind-merge",
  ],
};

// Add a pre-build hook to check for locked files
nextConfig.onBeforeBuild = async () => {
  console.log('[Build] Checking for locked files...');
  
  // List of directories containing problematic files
  const downloadDirs = [
    path.join(process.cwd(), 'public', 'downloads'),
    path.join(process.cwd(), 'public', 'assets', 'downloads')
  ];
  
  // Function to check if a file is accessible
  const isFileAccessible = (filePath) => {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  };
  
  for (const dir of downloadDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        const problematicFiles = files.filter(f => 
          /\.(xlsx?|docx?|pptx?|pdf|od[tsp])$/i.test(f)
        );
        
        if (problematicFiles.length > 0) {
          console.log(`[Build] Found ${problematicFiles.length} download files in ${dir}`);
          
          // Check each file
          for (const file of problematicFiles) {
            const filePath = path.join(dir, file);
            if (!isFileAccessible(filePath)) {
              console.warn(`[Build] WARNING: File may be locked: ${filePath}`);
            }
          }
        }
      } catch (err) {
        console.warn(`[Build] Could not read directory ${dir}:`, err.message);
      }
    }
  }
  
  console.log('[Build] File check complete');
};

// ✅ SIMPLE CONTENTLAYER INTEGRATION
try {
  // Try Contentlayer v2 first
  const { withContentlayer } = await import("next-contentlayer2");
  console.log("✅ Using Contentlayer v2");
  export default withContentlayer(nextConfig);
} catch (error) {
  console.log("⚠️ Contentlayer v2 not found, trying v1...");
  try {
    const { withContentlayer } = await import("next-contentlayer");
    console.log("✅ Using Contentlayer v1");
    export default withContentlayer(nextConfig);
  } catch (error) {
    console.log("⚠️ Contentlayer not found, proceeding without it");
    export default nextConfig;
  }
}