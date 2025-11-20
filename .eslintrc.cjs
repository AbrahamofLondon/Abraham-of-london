// .eslintrc.cjs
const path = require("path");

module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  plugins: ["@typescript-eslint"],

  settings: {
    "import/resolver": {
      alias: {
        map: [
          ["@", path.resolve(__dirname, "./")],
          ["@/components", path.resolve(__dirname, "./components")],
          ["@/content", path.resolve(__dirname, "./content")],
          ["@/lib", path.resolve(__dirname, "./lib")],
          ["@/pages", path.resolve(__dirname, "./pages")],
          ["@/netlify", path.resolve(__dirname, "./netlify")],
          ["@/types", path.resolve(__dirname, "./types")],
          [
            "contentlayer/generated",
            path.resolve(__dirname, "./.contentlayer/generated"),
          ],
        ],
        extensions: [".js", ".jsx", ".ts", ".tsx", ".mdx"],
      },
      typescript: {},
    },
  },

  rules: {
    // TypeScript rules
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/triple-slash-reference": "off",
    "@typescript-eslint/no-misused-promises": "off",

    // React/Next rules
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "@next/next/no-img-element": "off", // We're using Next.js Image now
    "@next/next/no-html-link-for-pages": "warn",

    // Hooks
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error",

    // General
    "import/no-anonymous-default-export": "warn",
    "prefer-const": "warn",
    "prefer-rest-params": "warn",
  },

  overrides: [
    // Contentlayer generated files
    {
      files: [".contentlayer/generated/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "import/no-anonymous-default-export": "off",
        "@typescript-eslint/ban-types": "off",
      },
    },

    // Components and pages
    {
      files: [
        "components/**/*.tsx",
        "components/**/*.ts",
        "data/**/*.ts",
        "hooks/**/*.ts",
        "pages/**/*.tsx",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "react-hooks/rules-of-hooks": "warn",
      },
    },

    // TypeScript declaration files
    {
      files: ["**/*.d.ts"],
      rules: {
        "@typescript-eslint/triple-slash-reference": "off",
      },
    },

    // MDX components - allow img elements since we're using Next/Image
    {
      files: ["components/mdx/**/*.ts", "components/mdx/**/*.tsx"],
      rules: {
        "@next/next/no-img-element": "off",
      },
    },

    // API routes and lib files
    {
      files: ["pages/api/**/*.ts", "lib/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "import/no-anonymous-default-export": "off",
        "prefer-rest-params": "off",
      },
    },
  ],
};