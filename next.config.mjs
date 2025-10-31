/** @type {import('next').NextConfig} */
const nextConfig = {
  // If you are deploying with Netlify’s Next runtime or doing static export,
  // unoptimized avoids edge loaders breaking images.
  images: { unoptimized: true },

  // Make sure you don't have basePath or assetPrefix unless you *need* them.
  // basePath: '',
  // assetPrefix: '',
};

module.exports = nextConfig;
