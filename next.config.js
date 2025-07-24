/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  reactStrictMode: true,

  experimental: {
    legacyReact: true, // ✅ This is what fixes Netlify import error
  },

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    };

    // Optional: enable if you hit .mjs/ESM issues in node_modules
    // config.module.rules.push({
    //   test: /\.mjs$/,
    //   include: /node_modules/,
    //   type: 'javascript/auto',
    // });

    return config;
=======
 // other Next.js configurations can go here
  images: {
    unoptimized: true, // Often needed for 'output: export' if you use next/image without a server
  },
  compiler: {
    styledComponents: true, // Keep if you use styled-components
>>>>>>> 4de6a5e0bf2f09c14b0e904dd196874465326cf7
  },
};

module.exports = nextConfig;
<<<<<<< HEAD
=======


>>>>>>> 4de6a5e0bf2f09c14b0e904dd196874465326cf7
