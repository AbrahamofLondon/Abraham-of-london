// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Keep this true generally
  // Add or ensure this part
  compiler: {
    // This setting is for styled-components, but sometimes relevant for other JSX issues
    // styledComponents: true, // If you're using styled-components
  },
  // If the above doesn't work, try explicitly setting the JSX runtime
  // NOTE: This usually isn't needed for Next.js 12+ as it's default
  // but can be a debug step.
  // webpack: (config, { isServer }) => {
  //   config.module.rules.push({
  //     test: /\.(js|jsx|ts|tsx)$/,
  //     exclude: /node_modules/,
  //     use: [
  //       {
  //         loader: 'babel-loader',
  //         options: {
  //           presets: ['next/babel'],
  //           plugins: [
  //             ['@babel/transform-react-jsx', { runtime: 'automatic' }] // Or 'classic'
  //           ]
  //         }
  //       }
  //     ]
  //   });
  //   return config;
  // },
}

module.exports = nextConfig;