// .eslintrc.cjs
module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "react/no-unescaped-entities": "off",

    // Global guardrail: keep server-only modules out of random imports
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/lib/server/*", "@/lib/rate-limit-unified"],
            message: "Server-only module. Import only inside server code (API routes, server actions, lib/server/*).",
          },
        ],
      },
    ],
  },

  overrides: [
    /**
     * UI / Client-facing bundles: forbid Prisma + DB bridges.
     * IMPORTANT: app router contains BOTH client and server files.
     * We allow server locations explicitly.
     */
    {
      files: ["components/**/*.{ts,tsx}", "pages/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      excludedFiles: [
        "pages/api/**/*.{ts,tsx}",
        "scripts/**/*.{ts,tsx}",

        // App Router server locations
        "app/**/api/**/*.{ts,tsx}",
        "app/**/actions/**/*.{ts,tsx}",
        "app/**/*.{server,route}.{ts,tsx}",
        "app/**/route.{ts,tsx}",
        "app/**/middleware.{ts,tsx}",

        // Explicit server-only patterns you may use
        "**/*.server.{ts,tsx}",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              { group: ["@prisma/client"], message: "Do not import Prisma in UI bundles." },
              { group: ["@/lib/prisma", "@/lib/prisma.server", "@/lib/db/*", "@/lib/db"], message: "DB modules are server-only." },
              { group: ["@/lib/server/*"], message: "Server-only module." },
            ],
          },
        ],
      },
    },

    /**
     * Server contexts: allow Prisma/DB.
     */
    {
      files: ["pages/api/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx}", "app/**/api/**/*.{ts,tsx}", "app/**/actions/**/*.{ts,tsx}", "**/*.server.{ts,tsx}", "app/**/route.{ts,tsx}"],
      rules: {},
    },
  ],
};