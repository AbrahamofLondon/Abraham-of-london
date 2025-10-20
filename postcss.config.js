// postcss.config.js
module.exports = {
  plugins: [
    // ✅ custom plugin as a function
    require("./postcss/no-slash-opacity")({
      mode: process.env.NO_SLASH_OPACITY_MODE || "error",
    }),

    // ✅ standard plugins
    require("tailwindcss"),
    require("autoprefixer"),
    require("postcss-flexbugs-fixes"),
    require("postcss-preset-env")({
      autoprefixer: { flexbox: "no-2009" },
      stage: 3,
      features: { "custom-properties": false },
    }),
  ],
};
