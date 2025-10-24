/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TEMPORARY: let the app run even with TS errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // TEMPORARY: don’t block builds on lint errors
    ignoreDuringBuilds: true,
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
};

export default nextConfig;
