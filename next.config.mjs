import path from "path";
import { fileURLToPath } from "url";
import { withContentlayer } from "next-contentlayer2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment Detection
const isNetlify = process.env.NETLIFY === "true";
const isCI = process.env.CI === "true" || isNetlify;
const isWindows = process.platform === "win32";
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = !isProduction;

// Wrap Windows specific patches in a function
async function applyWindowsPatches() {
  if (isWindows && !process.env.DISABLE_WINDOWS_FIX) {
    try {
      const { applyWindowsFix } = await import("./patches/windows-fix.mjs");
      if (typeof applyWindowsFix === "function") {
        await applyWindowsFix();
      }
    } catch (error) {
      if (isDevelopment) {
        console.warn("⚠️ Windows fix patch not found, continuing without it...");
      }
    }
  }
}

/** @type {import("next").NextConfig} */
const nextConfigBase = {
  /* --- CORE CONFIGURATION --- */
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  
  /* --- NETLIFY SPECIFIC CONFIG --- */
  output: isNetlify ? 'standalone' : undefined,
  
  /* --- IMAGE OPTIMIZATION --- */
  images: {
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "**",
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24,
  },
  
  /* --- ERROR HANDLING --- */
  typescript: {
    ignoreBuildErrors: isNetlify && process.env.NETLIFY_TS_IGNORE === "true",
  },
  eslint: {
    dirs: ["pages", "components", "lib", "types", "app", "utils", "scripts"],
    ignoreDuringBuilds: isNetlify || process.env.NEXT_IGNORE_ESLINT === "1",
  },
  
  /* --- ENVIRONMENT VARIABLES --- */
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-R2Y3YMY8F8",
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "1.0.0",
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_IS_NETLIFY: isNetlify ? "true" : "false",
    NEXT_PUBLIC_IS_WINDOWS: isWindows ? "true" : "false",
    NEXT_PUBLIC_PDF_GENERATION_ENABLED: "true",
  },
  
  /* --- COMPILER OPTIMIZATIONS --- */
  compiler: {
    removeConsole: isProduction && !isNetlify ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  /* --- EXPERIMENTAL FEATURES --- */
  experimental: {
    esmExternals: true,
    externalDir: true,
    serverComponentsExternalPackages: [
      'pg', 
      'pg-native', 
      'crypto',
      'sharp',
      'fs-extra',
      'pdf-lib',
      'fontkit',
      '@pdf-lib/fontkit'
    ],
    optimizeCss: isNetlify ? false : true,
    scrollRestoration: true,
    workerThreads: true,
    cpus: isNetlify ? 2 : 4,
  },
  
  /* --- FILE HANDLING --- */
  pageExtensions: ["tsx", "ts", "jsx", "js", "mdx", "md"],
  
  /* --- STATIC OPTIMIZATION --- */
  staticPageGenerationTimeout: isWindows ? 120 : isNetlify ? 300 : 60,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
  
  /* --- WEBPACK CONFIGURATION --- */
  webpack: (config, { dev, isServer, buildId, webpack }) => {
    const isDev = dev;
    const isProd = !dev;
    
    /* --- PATH ALIASES --- */
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/components": path.resolve(__dirname, "components"),
      "@/scripts": path.resolve(__dirname, "scripts"),
      "@/utils": path.resolve(__dirname, "utils"),
      "@/types": path.resolve(__dirname, "types"),
      "@/public": path.resolve(__dirname, "public"),
      "@/content": path.resolve(__dirname, "content"),
      "contentlayer/generated": path.resolve(__dirname, ".contentlayer/generated"),
      ".contentlayer/generated": path.resolve(__dirname, ".contentlayer/generated"),
    };
    
    /* --- EXTENSIONS RESOLUTION --- */
    config.resolve.extensions = [
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".mjs",
      ".cjs",
      ".json",
      ".wasm",
      ...(config.resolve.extensions || []),
    ];
    
    /* --- WINDOWS-SPECIFIC OPTIMIZATIONS --- */
    if (isWindows) {
      console.log("🔧 Applying Windows-specific Webpack optimizations...");
      
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { 
          module: /node_modules[\\/](contentlayer2|@contentlayer2|mdast-util-mdx-jsx|mdast-util-to-markdown)/,
          message: /Can't resolve|Critical dependency/
        },
        {
          message: /(asset|module) size limit/
        },
      ];
      
      // Fix Windows path issues in Contentlayer
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /[\\/]\.contentlayer[\\/]/,
          (resource) => {
            if (resource.request) {
              resource.request = resource.request.replace(/\\/g, "/");
            }
          }
        )
      );
      
      // Windows memory optimization
      config.performance = {
        ...config.performance,
        hints: isProd ? "warning" : false,
        maxAssetSize: 10 * 1024 * 1024,
        maxEntrypointSize: 10 * 1024 * 1024,
        assetFilter: (assetFilename) => {
          return !/(\.map$|\.LICENSE\.txt$|\.d\.ts$)/.test(assetFilename);
        },
      };
    }
    
    /* --- NETLIFY WEBPACK OPTIMIZATIONS --- */
    if (isNetlify) {
      console.log("🔧 Applying Netlify-specific Webpack optimizations...");
      
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 10000,
          maxSize: 200000,
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              reuseExistingChunk: true,
              priority: 10,
            },
          },
        },
      };
      
      config.performance = {
        ...config.performance,
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      };
    }
    
    /* --- SVG HANDLING --- */
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.(tsx|ts|jsx|js|mdx|md)$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: "preset-default",
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
                "prefixIds",
                "removeDimensions",
              ],
            },
          },
        },
      ],
    });
    
    /* --- PDF GENERATION SUPPORT --- */
    config.module.rules.push({
      test: /\.(pdf)$/i,
      type: "asset/resource",
      generator: {
        filename: "static/assets/[name].[hash][ext]",
      },
    });
    
    /* --- MDX SUPPORT FOR CONTENTLAYER --- */
    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        {
          loader: 'contentlayer2/webpack',
          options: {},
        },
      ],
    });
    
    /* --- SERVER-SIDE FALLBACKS --- */
    if (!isServer) {
      // Dynamically import fallback modules when needed
      config.externals = [
        ...(config.externals || []),
        ({ context, request }, callback) => {
          // These are browser-only fallbacks that need dynamic import
          const browserFallbacks = [
            'path-browserify',
            'crypto-browserify', 
            'stream-browserify',
            'buffer/',
            'util/',
            'assert/',
            'stream-http',
            'https-browserify',
            'os-browserify/browser',
            'url/'
          ];
          
          if (browserFallbacks.some(fallback => request.includes(fallback))) {
            return callback(null, `commonjs ${request}`);
          }
          
          callback();
        },
      ];
    }
    
    /* --- NATIVE MODULE FIXES --- */
    config.externals = [
      ...(config.externals || []),
      ({ context, request }, callback) => {
        if (/^(pg-native|sharp|canvas|sqlite3)$/.test(request)) {
          return callback(null, `commonjs ${request}`);
        }
        
        if (!isServer && /^(pdf-lib|fontkit|@pdf-lib\/fontkit)$/.test(request)) {
          return callback(null, `commonjs ${request}`);
        }
        
        callback();
      },
    ];
    
    /* --- DEFINE PLUGIN FOR BUILD INFO --- */
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.BUILD_ID": JSON.stringify(buildId),
        "process.env.IS_WINDOWS": JSON.stringify(isWindows),
        "process.env.IS_NETLIFY": JSON.stringify(isNetlify),
        "process.env.APP_VERSION": JSON.stringify(process.env.npm_package_version || "1.0.0"),
        "process.env.NEXT_PUBLIC_BUILD_TIME": JSON.stringify(new Date().toISOString()),
      })
    );
    
    return config;
  },
  
  /* --- HEADERS & SECURITY --- */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cache-Control",
            value: isProduction ? "public, max-age=3600, stale-while-revalidate=86400" : "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/downloads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=31536000",
          },
          {
            key: "Content-Disposition",
            value: "attachment",
          },
        ],
      },
    ];
  },
  
  /* --- REDIRECTS --- */
  async redirects() {
    const redirects = [
      {
        source: "/vault",
        destination: "/vault",
        permanent: true,
      },
    ];
    
    if (!isNetlify) {
      redirects.push(
        {
          source: '/downloads/purpose-pyramid-worksheet-fillable.pdf',
          destination: '/downloads/purpose-pyramid.pdf',
          permanent: true,
        },
        {
          source: '/downloads/decision-matrix-worksheet-fillable.pdf',
          destination: '/downloads/decision-matrix.pdf',
          permanent: true,
        },
        {
          source: '/downloads/legacy-canvas-worksheet-fillable.pdf',
          destination: '/downloads/legacy-canvas.pdf',
          permanent: true,
        }
      );
    }
    
    return redirects;
  },
};

// Wrap base config with Contentlayer
const configWithContentlayer = withContentlayer(nextConfigBase);

// Main config export function
export default async function nextConfig() {
  // Apply Windows patches if needed
  await applyWindowsPatches();
  
  // Log build environment
  if (isNetlify) {
    console.log('🚀 Building for Netlify deployment');
    console.log('📦 Using standalone output mode');
  }
  
  if (isWindows) {
    console.log("🚀 Starting Abraham of London on Windows");
  }
  
  // Always return the Contentlayer-wrapped config
  return configWithContentlayer;
}