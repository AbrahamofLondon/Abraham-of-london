// jest.config.mjs
import nextJest from "next/jest";

const createJestConfig = nextJest({
  // Path to your Next app root (loads next.config & .env)
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // ✅ correct key name
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!jest.config.*",
    "!next.config.*",
  ],

  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
  },
};

export default createJestConfig(customJestConfig);
