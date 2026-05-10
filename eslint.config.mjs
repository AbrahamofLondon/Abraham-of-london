// eslint.config.mjs — Flat config for ESLint v10
// Migration from .eslintrc.cjs. Kept minimal — extends Next.js recommended rules.

import next from "@next/eslint-plugin-next";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      ".contentlayer/**",
      "public/**",
      "tmp/**",
      "coverage/**",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@next/next": next,
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/no-unescaped-entities": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
