/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TEMPORARY: let the app run even with TS errors
    ignoreBuildErrors: true,
  },
  
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
};

export default nextConfig;
