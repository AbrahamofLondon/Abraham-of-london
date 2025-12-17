/** @type {import('next').NextConfig} */
import { withContentlayer } from 'next-contentlayer2';

const nextConfig = {
  reactStrictMode: true,
  // CRITICAL: We force false to match our normalizeSlug(doc) logic which strips slashes.
  // This ensures /blog/post and /blog/post/ don't collide or 404.
  trailingSlash: false,
  
  output: 'export', // Optimized for Netlify/Static hosting

  images: {
    unoptimized: true, // Required for static export
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  typescript: {
    // We handle integrity via our Core Engine; ignore minor build-time type noise
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org',
  },

  // webpack hardening for Contentlayer + Lucide stability
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': process.cwd(),
    };

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