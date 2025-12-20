/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';
import { withContentlayer } from 'next-contentlayer2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false, // ✅ Changed to match contentlayer URLs without trailing slashes
  
  // ✅ Required for static export
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  
  compress: true,
  poweredByHeader: false,
  
  // Temporary build fixes
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org',
    NEXT_PUBLIC_INNOVATEHUB_URL: process.env.NEXT_PUBLIC_INNOVATEHUB_URL || 'https://innovatehub.abrahamoflondon.org',
    NEXT_PUBLIC_ALOMARADA_URL: process.env.NEXT_PUBLIC_ALOMARADA_URL || 'https://alomarada.com/',
    NEXT_PUBLIC_ENDURELUXE_URL: process.env.NEXT_PUBLIC_ENDURELUXE_URL || 'https://alomarada.com/endureluxe',
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-R2Y3YMY8F8',
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  // ✅ Simple webpack config for static export
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': process.cwd(),
    };
    
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Client-side fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
      };
    }
    
    return config;
  },
};

export default withContentlayer(nextConfig);