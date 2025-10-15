module.exports = {
  plugins: {
    "./postcss/no-slash-opacity": {
      mode: process.env.NO_SLASH_OPACITY_MODE || "error",
    },
    tailwindcss: {},
    autoprefixer: {},
  },
};
