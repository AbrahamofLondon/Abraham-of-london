// lib/inner-circle/exports.ts
// This file ensures all required exports are available

// Import the main module first
import innerCircleStore from './index';

// Also import from keys module for direct export
import { getEmailHash } from './keys';

// Re-export everything from the main index
export * from './index';

// Export functions with explicit names
export const withInnerCircleRateLimit = innerCircleStore.withInnerCircleRateLimit;
export const getPrivacySafeKeyExportWithRateLimit = innerCircleStore.getPrivacySafeKeyExportWithRateLimit;
export const getPrivacySafeStatsWithRateLimit = innerCircleStore.getPrivacySafeStatsWithRateLimit;
export const createRateLimitHeaders = innerCircleStore.createRateLimitHeaders;
export const INNER_CIRCLE_CONFIG = innerCircleStore.config;
export const healthCheckEnhanced = innerCircleStore.healthCheckEnhanced;
export const createOrUpdateMemberAndIssueKeyWithRateLimit = innerCircleStore.createOrUpdateMemberAndIssueKeyWithRateLimit;
export const verifyInnerCircleKeyWithRateLimit = innerCircleStore.verifyInnerCircleKeyWithRateLimit;

// Re-export from keys module
export { getEmailHash };

// Create a default export that includes everything
const innerCircleExports = {
  // Rate limiting functions
  withInnerCircleRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  getPrivacySafeStatsWithRateLimit,
  createRateLimitHeaders,
  INNER_CIRCLE_CONFIG,
  healthCheckEnhanced,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  
  // Keys module exports
  getEmailHash,
  
  // Pass through everything from the main store
  ...innerCircleStore
};

// Export as default as well
export default innerCircleExports;
