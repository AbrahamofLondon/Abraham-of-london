import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Standard institutional environment
    environment: 'node',
    globals: true,

    // Exclude Playwright e2e tests, build output, and sub-package node_modules
    exclude: [
      'tests/e2e/**',
      '.next/**',
      'node_modules/**',
      '**/node_modules/**',
      '_tests_/components/**',
    ],

    // Path Aliasing for clean imports
    alias: {
      '@': path.resolve(__dirname, './'),
    },

    // Coverage Gating: Ensures 10/10 reliability
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/ai/**/*.ts'],
      exclude: [
        'node_modules/**',
        'lib/ai/__tests__/**',
      ],
      // Thresholds: Institutional deals require absolute precision
      thresholds: {
        lines: 90,
        functions: 95,
        branches: 85,
        statements: 90,
      },
    },

    // Performance: Fast feedback loops
    maxConcurrency: 5,
    testTimeout: 10000,
  },
});