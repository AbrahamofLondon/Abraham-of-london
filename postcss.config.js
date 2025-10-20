module.exports = {
  plugins: {
    // Keep your custom plugin
    "./postcss/no-slash-opacity": {
      mode: process.env.NO_SLASH_OPACITY_MODE || "error",
    },
    // Keep standard plugins
    tailwindcss: {},
    autoprefixer: {},
    // Add plugins from the remote version (if they are needed/missing)
    "postcss-flexbugs-fixes": {},
    "postcss-preset-env": {
      autoprefixer: {
        flexbox: 'no-2009'
      },
      stage: 3,
      features: {
        'custom-properties': false
      }
    }
  },
};