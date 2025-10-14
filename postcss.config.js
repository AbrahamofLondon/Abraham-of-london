// postcss.config.js — pass mode via env (error by default)
const guard = require('./postcss/no-slash-opacity');

module.exports = {
  plugins: [
    guard({ mode: process.env.NO_SLASH_OPACITY_MODE || 'error' }),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
