// postcss.config.js (or .cjs) - Correct
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // Use the new dedicated plugin package
    'autoprefixer': {},
  },
}