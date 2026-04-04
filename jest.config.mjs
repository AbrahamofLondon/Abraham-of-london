import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Path to your Next app root (loads next.config & .env)
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // Use jsdom for component testing, but it supports node tests in /lib/
  testEnvironment: "jest-environment-jsdom",
  
  // Unified setup files
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js", "<rootDir>/tests/setup.ts"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // Consolidation of roots and matching
  roots: ["<rootDir>/tests", "<rootDir>/lib"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],

  // Merged coverage strategy: Global app + deep OGR-IV logic
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "lib/predictive/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!jest.config.*",
    "!next.config.*",
    "!lib/predictive/**/*.test.ts",
    "!lib/predictive/**/types.ts",
  ],

  // Sovereign Alignment Thresholds (Aligned to 80% for integrity)
  coverageThreshold: {
    global: { 
      branches: 80, 
      functions: 80, 
      lines: 80, 
      statements: 80 
    },
  },

  testTimeout: 30000,
  verbose: true,
};

export default createJestConfig(customJestConfig);