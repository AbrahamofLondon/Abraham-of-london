// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- THIS MUST BE HERE
    autoprefixer: {},
  },
};
=======
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
