// postcss.config.js — load guard BEFORE tailwindcss
module.exports = {
  plugins: [
    require('./postcss/no-slash-opacity'), // 🚨 fails build on bad tokens
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
