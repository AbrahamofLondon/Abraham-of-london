/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Keep webpack alias configuration if you encountered React/React-DOM resolution issues
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    };

    // Optional: enable if you hit .mjs/ESM issues in node_modules
    // config.module.rules.push({
    //    test: /\.mjs$/,
    //    include: /node_modules/,
    //    type: 'javascript/auto',
    // });

    return config;
  },

  // ONLY include compiler.styledComponents if you are actively using styled-components library
  // If you are only using Tailwind CSS, you can remove this block.
  compiler: {
    styledComponents: true,
  },

  // Do NOT include images.unoptimized: true unless you are doing a full static export (output: 'export')
  // and not using Netlify's Next.js plugin for image optimization.
  // images: {
  //   unoptimized: true,
  // },
};

module.exports = nextConfig;