import js from "@eslint/js";
import globals from "globals";
import next from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  // 1) Global ignores (this is the flat-config replacement for .eslintignore)
  {
    ignores: [
      ".next/**",
      ".out/**",
      "out/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      ".contentlayer/**",
      ".turbo/**",
      ".cache/**",
      ".reports/**",

      "public/**",

      "backup-*/**",
      "**/backup-*/**",

      // quarantine zones
      "scripts/**",
      "tools/**",
      "prisma/**",
      "data/**",
      "netlify/**",

      // tests
      "**/*.test.*",
      "**/*.spec.*",
      "__tests__/**",
      "__mocks__/**"
    ],
  },

  // 2) Base JS rules
  js.configs.recommended,

  // 3) Next rules (only for your Next surface area)
  {
    files: ["pages/**/*.{js,jsx,ts,tsx}", "components/**/*.{js,jsx,ts,tsx}", "lib/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}"],
    plugins: { "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },

  // 4) TypeScript rules (scoped)
  ...tseslint.config({
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true
      }
    },
    rules: {
      // keep it practical — you can tighten later
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  }),

  // 5) Node scripts (IF you ever choose to lint them later; currently ignored)
  {
    files: ["scripts/**/*.{js,mjs,ts}", "tools/**/*.{js,mjs,ts}", "netlify/**/*.{js,mjs,ts}", "data/**/*.{js,mjs,ts}"],
    languageOptions: {
      globals: globals.node,
      sourceType: "module"
    },
    rules: {
      "no-console": "off"
    }
  }
];