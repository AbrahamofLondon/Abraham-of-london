// .eslintrc.cjs
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    "@typescript-eslint",
    "import",
    "unused-imports",
    "prettier"
  ],
  extends: [
    "next",
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],

  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json",
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
  },

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
    
    // ---- Import Optimization Rules ----
    "import/no-internal-modules": ["error", {
      "allow": [
        "@/components/Cards/**",
        "@/lib/imports",
        "@/lib/utils",
        "@/lib/image-utils",
        "@/lib/siteConfig"
      ]
    }],
    "import/no-duplicates": ["error", {
      "prefer-inline": false
    }],
    "import/order": ["error", {
      "groups": [
        "builtin",
        "external",
        "internal",
        ["parent", "sibling"],
        "index",
        "object",
        "type"
      ],
      "pathGroups": [
        {
          "pattern": "react",
          "group": "external",
          "position": "before"
        },
        {
          "pattern": "next/**",
          "group": "external",
          "position": "before"
        },
        {
          "pattern": "@/components/Cards/**",
          "group": "internal",
          "position": "before"
        },
        {
          "pattern": "@/lib/imports",
          "group": "internal",
          "position": "before"
        },
        {
          "pattern": "@/lib/**",
          "group": "internal",
          "position": "after"
        },
        {
          "pattern": "@/components/**",
          "group": "internal",
          "position": "after"
        }
      ],
      "pathGroupsExcludedImportTypes": ["builtin", "react"],
      "newlines-between": "always",
      "alphabetize": {
        "order": "asc",
        "caseInsensitive": true,
        "orderImportKind": "asc"
      },
      "warnOnUnassignedImports": true
    }],
    "unused-imports/no-unused-imports": "error",
    "import/no-unused-modules": ["error", {
      "unusedExports": true,
      "missingExports": true,
      "ignoreExports": [
        "**/*.d.ts",
        "**/*.config.*",
        "**/pages/**/*",
        "**/app/**/*"
      ]
    }],
    "import/no-cycle": ["error", { "maxDepth": 5 }],
    "import/no-self-import": "error",
    "import/no-useless-path-segments": ["error", {
      "noUselessIndex": true
    }],

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
    "@next/next/no-css-tags": "warn",
    "@next/next/no-sync-scripts": "warn",
    
    // ---- React specific ----
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
  },

  overrides: [
    // Card system files: strict import rules
    {
      files: ["components/Cards/**/*.{ts,tsx}", "lib/imports.ts"],
      rules: {
        "import/no-internal-modules": ["error", {
          "allow": [
            "next/**",
            "next/image",
            "next/link",
            "@/lib/**",
            "@/types/**"
          ]
        }],
        "@typescript-eslint/no-explicit-any": "error",
        "import/no-cycle": ["error", { "maxDepth": 3 }],
      },
    },

    // Pages & API routes: more permissive
    {
      files: [
        "pages/**/*.{ts,tsx}",
        "app/**/*.{ts,tsx}",
        "pages/api/**/*.{ts,tsx}",
      ],
      rules: {
        "import/no-internal-modules": ["error", {
          "allow": [
            "@/components/Cards/**",
            "@/lib/imports",
            "@/lib/utils",
            "@/lib/image-utils",
            "@/lib/siteConfig"
          ]
        }],
        "@typescript-eslint/no-explicit-any": "warn",
        "import/no-unused-modules": "off",
      },
    },

    // Utility / infra code: more permissive rules
    {
      files: [
        "lib/**/*.{ts,tsx}",
        "lib/server/**/*.{ts,tsx}",
        "scripts/**/*.{ts,tsx}",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/require-await": "off",
        "import/no-internal-modules": "off",
      },
    },

    // Type declaration files
    {
      files: ["**/*.d.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "import/no-unused-modules": "off",
      },
    },

    // Test files
    {
      files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/test-utils/**/*"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "import/no-internal-modules": "off",
      },
    },

    // Contentlayer generated files
    {
      files: [".contentlayer/generated/**/*"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "import/no-internal-modules": "off",
        "import/no-unused-modules": "off",
      },
    },

    // Configuration files
    {
      files: ["**/*.config.{js,cjs,mjs,ts}", "**/*.config.*.{js,cjs,mjs,ts}"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "import/no-unused-modules": "off",
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
    ".eslintrc.cjs",
    "next.config.*",
    "postcss.config.*",
    "tailwind.config.*",
    "tsconfig.*",
    "**/*.config.js",
    "**/*.config.cjs",
    "**/*.config.mjs",
  ],
};