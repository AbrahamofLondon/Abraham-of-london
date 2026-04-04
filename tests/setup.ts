import '@testing-library/jest-dom';
import { db } from '@/lib/db';

/**
 * SOVEREIGN TEST SUITE SETUP
 * Standardizing the environment for OGR-IV Protocol testing.
 */

// Mock console.error to keep test output clean, but allow specific OGR errors through
const originalError = console.error;
beforeAll(async () => {
  console.error = jest.fn((...args) => {
    if (args[0]?.includes?.('[EXECUTIVE_REPORT_SERVICE_FAILURE]')) {
      // Keep visibility on critical service failures during testing
      originalError(...args);
    }
  });
});

afterAll(async () => {
  console.error = originalError;
  // Ensure the database connection is closed after all tests to prevent hang
  if (db && typeof (db as any).$disconnect === 'function') {
    await (db as any).$disconnect();
  }
});

// Reset internal state between tests if necessary
beforeEach(() => {
  jest.clearAllMocks();
});

// Global timeout for high-density PDF generation tests
jest.setTimeout(30000);