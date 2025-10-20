const path = require("path");
const fs = require("fs");

const localPluginPath = path.join(__dirname, "postcss", "no-slash-opacity.js");
const hasLocalPlugin = fs.existsSync(localPluginPath);

module.exports = {
  // Use ARRAY form so we can pass actual plugin functions
  plugins: [
    // Optional local plugin
    ...(hasLocalPlugin
      ? [require(localPluginPath)({ mode: process.env.NO_SLASH_OPACITY_MODE || "error" })]
      : []),

    require("tailwindcss"),
    require("autoprefixer"),
    require("postcss-flexbugs-fixes"),
    [
      "postcss-preset-env",
      {
        autoprefixer: { flexbox: "no-2009" },
        stage: 3,
        features: { "custom-properties": false }
      }
    ]
  ]
};
