// .eslintrc.cjs
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "next",
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:prettier/recommended",
  ],

  rules: {
    // ---- Global defaults (reasonably strict but build-friendly) ----
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],

    // ---- Rules to prevent build failures ----
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/require-await": "warn",
    "@typescript-eslint/no-base-to-string": "warn",
    "@typescript-eslint/no-redundant-type-constituents": "warn",
    "@typescript-eslint/restrict-template-expressions": "warn",

    // ---- Next.js specific ----
    "@next/next/no-html-link-for-pages": "warn",
    "@next/next/no-img-element": "warn",
  },

  overrides: [
    // Utility / infra code: more permissive rules
    {
      files: [
        "lib/**/*.{ts,tsx}",
        "lib/server/**/*.{ts,tsx}",
        "pages/api/**/*.{ts,tsx}",
        "scripts/**/*.{ts,tsx}",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/require-await": "off",
      },
    },

    // Type declaration files
    {
      files: ["**/*.d.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
      },
    },

    // Test files
    {
      files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/test-utils/**/*"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
      },
    },

    // Contentlayer generated files (if any)
    {
      files: [".contentlayer/generated/**/*"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],

  // Ignore patterns for files that don't need linting
  ignorePatterns: [
    ".next/",
    "node_modules/",
    "dist/",
    "build/",
    ".contentlayer/",
    "*.config.js",
    "*.config.cjs",
    "*.config.mjs",
  ],
};
