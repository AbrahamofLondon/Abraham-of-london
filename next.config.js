/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  serverExternalPackages: ["@react-email/components", "better-sqlite3"],

  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },

  compress: true,
  poweredByHeader: false,
  typescript: { 
    ignoreBuildErrors: false,  // Changed to false to see real errors
  },

  // Expose environment variables to the browser
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org',
    NEXT_PUBLIC_INNOVATEHUB_URL: process.env.NEXT_PUBLIC_INNOVATEHUB_URL || 'https://innovatehub.abrahamoflondon.org',
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-R2Y3YMY8F8',
    NEXT_PUBLIC_ALOMARADA_URL: process.env.NEXT_PUBLIC_ALOMARADA_URL || 'https://alomarada.com/',
    NEXT_PUBLIC_ENDURELUXE_URL: process.env.NEXT_PUBLIC_ENDURELUXE_URL || 'https://alomarada.com/endureluxe',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || '',
  },

  async redirects() {
    return [
      {
        source: "/canon/volume-i-foundations-of-purpose",
        destination: "/volume-i-foundations-of-purpose",
        permanent: true,
      },
    ];
  },

  async headers() {
    const csp = [
      "default-src 'self';",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "img-src 'self' data: https:;",  // CHANGED: Allow all HTTPS images
      "font-src 'self' https://fonts.gstatic.com;",
      "connect-src 'self' https://www.google-analytics.com;",
      "frame-ancestors 'none';",
      "base-uri 'self';",
      "form-action 'self';",
    ].join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Add output configuration for Netlify
  output: 'standalone',

  // Optimize for Netlify
  experimental: {
    optimizeCss: true,
  },

  // Simplified webpack config
  webpack: (config, { isServer, dev }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': process.cwd(),
    };

    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        { "better-sqlite3": "commonjs better-sqlite3" },
      ];
    }

    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;