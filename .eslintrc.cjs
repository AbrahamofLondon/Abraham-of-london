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
  ],
  plugins: ["@typescript-eslint", "react", "react-hooks", "jsx-a11y"],
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { 
        argsIgnorePattern: "^_", 
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unnecessary-type-constraint": "warn",
    
    // React rules
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "react/no-unknown-property": "off",
    "react/jsx-no-undef": "off",

    // Next.js rules
    "@next/next/no-img-element": "warn",
    "@next/next/no-html-link-for-pages": "warn",

    // A11y rules
    "jsx-a11y/label-has-associated-control": "warn",
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/no-noninteractive-element-interactions": "warn",
    "jsx-a11y/no-redundant-roles": "warn",
    "jsx-a11y/no-autofocus": "warn",

    // Security rules
    "react/jsx-no-target-blank": "warn",

    // Code quality rules
    "no-useless-escape": "warn",
    "no-irregular-whitespace": "error",
    "prefer-const": "warn",
    
    // Import/export rules
    "import/no-anonymous-default-export": "off",
  },

  overrides: [
    {
      files: ["**/*.d.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unnecessary-type-constraint": "off",
      },
    },
    {
      files: ["**/*.tsx", "**/*.ts"],
      rules: {
        "no-irregular-whitespace": "error",
      },
    },
    {
      files: ["**/pages/**/*.tsx", "**/components/**/*.tsx"],
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
  ],
};