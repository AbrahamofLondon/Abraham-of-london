module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    // Downgrade to 'warn' and allow underscore-prefixed variables for deliberate omissions
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { 
        argsIgnorePattern: "^_", 
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_" 
      },
    ],
    // Disable strict unescaped entities check to allow for standard prose characters
    "react/no-unescaped-entities": "off",
  },
};

// Disallow server modules from UI code
"no-restricted-imports": ["error", {
  "patterns": [
    {
      "group": ["@/lib/server/*", "@/lib/rate-limit-unified"],
      "message": "Server-only module. Import only inside pages/api/* or lib/server/*."
    }
  ]
}]