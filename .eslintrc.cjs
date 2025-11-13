// .eslintrc.cjs
const path = require("path");

module.exports = {
  root: true,
  // Next.js base + TS-aware config
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
    // --- Turn TS lint into guidance, not a firing squad ---
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

    // React / Next rules
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "@next/next/no-img-element": "warn",
    "@next/next/no-html-link-for-pages": "warn",

    // Hooks
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error",

    // General hygiene (warnings only)
    "import/no-anonymous-default-export": "warn",
    "prefer-const": "warn",
    "prefer-rest-params": "warn",
  },

  overrides: [
    // Contentlayer generated files - most permissive
    {
      files: [".contentlayer/generated/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "import/no-anonymous-default-export": "off",
        "@typescript-eslint/ban-types": "off",
      },
    },

    // TS-heavy app code - soften some checks
    {
      files: [
        "components/**/*.tsx",
        "components/**/*.ts",
        "data/**/*.ts",
        "hooks/**/*.ts",
        "pages/**/*.tsx",
        "app/**/*.tsx",
        "app/**/*.ts",
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

    // MDX subtree
    {
      files: ["components/mdx/**/*.ts", "components/mdx/**/*.tsx"],
      rules: {
        "no-restricted-imports": "off",
      },
    },

    // API routes and lib files - very permissive
    {
      files: ["pages/api/**/*.ts", "app/api/**/*.ts", "lib/**/*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "import/no-anonymous-default-export": "off",
        "prefer-rest-params": "off",
      },
    },
  ],
};