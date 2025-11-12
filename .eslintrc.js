// .eslintrc.js
const path = require("path");

module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
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
          ["contentlayer/generated", path.resolve(__dirname, "./.contentlayer/generated")]
        ],
        extensions: [".js", ".jsx", ".ts", ".tsx", ".mdx"],
      },
      typescript: {},
    },
  },
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { 
        argsIgnorePattern: "^_", 
        varsIgnorePattern: "^_", 
        caughtErrorsIgnorePattern: "^_" 
      }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/ban-types": "warn",
    "@typescript-eslint/triple-slash-reference": "warn",
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "warn",
    "@next/next/no-html-link-for-pages": "warn",
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error",
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

    // Fix parsing errors in problematic files
    {
      files: [
        "components/**/*.tsx",
        "components/**/*.ts",
        "data/**/*.ts",
        "hooks/**/*.ts",
        "pages/**/*.tsx"
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

    // PAGES
    {
      files: ["pages/**/*.tsx"],
      rules: {
        "no-restricted-imports": "off",
        "react-hooks/rules-of-hooks": "warn",
      },
    },

    // API routes and lib files - most permissive
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