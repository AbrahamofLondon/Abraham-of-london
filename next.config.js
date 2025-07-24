k/** @type {import('next').NextConfig} */
const nextConfig = {
 // other Next.js configurations can go here
  images: {
    unoptimized: true, // Often needed for 'output: export' if you use next/image without a server
  },
  compiler: {
    styledComponents: true, // Keep if you use styled-components
  },
};

module.exports = nextConfig;

