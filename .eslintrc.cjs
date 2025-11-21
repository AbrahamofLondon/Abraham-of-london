/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "next",
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    // "prettier",
  ],
  plugins: ["@typescript-eslint", "react", "react-hooks", "jsx-a11y"],
  rules: {
    // General TS
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",

    // React
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "react/no-unknown-property": "off",
    "react/jsx-no-undef": "off",

    // Next.js
    "@next/next/no-img-element": "warn",

    // A11y
    "jsx-a11y/label-has-associated-control": "warn",
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/no-noninteractive-element-interactions": "warn",
    "jsx-a11y/no-redundant-roles": "warn",
    "jsx-a11y/no-autofocus": "warn",

    // Links security
    "react/jsx-no-target-blank": "warn",

    // Misc
    "no-useless-escape": "warn",
    "import/no-anonymous-default-export": "off",
  },

  // Important: declaration files are allowed to be loose and noisy
  overrides: [
    {
      files: ["**/*.d.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],
};