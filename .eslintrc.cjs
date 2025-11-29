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
    // ---- Global defaults (still reasonably strict) ----
    "@typescript-eslint/no-explicit-any": "warn", // ⬅ was "error"
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },

  overrides: [
    // Utility / infra code: we allow `any` completely here
    {
      files: [
        "lib/**/*.{ts,tsx}",
        "lib/server/**/*.{ts,tsx}",
        "pages/api/**/*.{ts,tsx}",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
    // Type declaration files
    {
      files: ["**/*.d.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};