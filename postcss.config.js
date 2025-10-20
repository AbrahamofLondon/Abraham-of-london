module.exports = {
  plugins: {
    // keep your custom plugin (if present at ./postcss/no-slash-opacity)
    "./postcss/no-slash-opacity": {
      mode: process.env.NO_SLASH_OPACITY_MODE || "error",
    },
    tailwindcss: {},
    autoprefixer: {},
    "postcss-flexbugs-fixes": {},
    "postcss-preset-env": {
      autoprefixer: {
        flexbox: "no-2009"
      },
      stage: 3,
      features: {
        "custom-properties": false
      }
    }
  }
};