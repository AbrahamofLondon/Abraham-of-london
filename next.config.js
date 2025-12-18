/** @type {import('next').NextConfig} */
import { withContentlayer } from 'next-contentlayer2';

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  
  // REMOVED: output: 'export' - This was blocking your API routes!
  
  images: {
    // Keep unoptimized: true if you want to save on Netlify bandwidth, 
    // but it's no longer strictly required without 'export'
    unoptimized: true, 
    dangerouslyAllowSVG: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    formats: ["image/avif", "image/webp"],
  },

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': process.cwd(),
    };

    // Prevent client-side bundling of server-only modules
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        net: false,  // Added for Prisma/Postgres stability
        tls: false,  // Added for Prisma/Postgres stability
      };
    }

    return config;
  },
};

export default withContentlayer(nextConfig);