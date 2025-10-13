// postcss.config.js
module.exports = {
  plugins: {
    // 1. Tailwind must be listed first to generate the utilities
    tailwindcss: {}, 
    // 2. Autoprefixer must be listed second to handle browser prefixes
    autoprefixer: {}, 
  },
};