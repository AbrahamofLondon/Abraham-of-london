// lib/imports.ts
// Central barrel export for all lib utilities

// ============================================================================
// Site Configuration
// ============================================================================
export const siteConfig = {
  siteName: "Abraham of London",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
  description: "Strategic assets for institutional architects",
  author: "Abraham of London",
  social: {
    twitter: "@abrahamoflondon",
    linkedin: "abrahamoflondon",
  },
};

export function getPageTitle(title?: string): string {
  return title ? `${title} | ${siteConfig.siteName}` : siteConfig.siteName;
}

// ============================================================================
// Contentlayer Helpers
// ============================================================================
export {
  // Raw Collections
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allCanons,
  allCanon, // Alias
  allShorts,
  
  // Retrieval Getters
  getAllContentlayerDocs,
  getPublishedDocuments,
  getPublishedDocumentsByType,
  getPublishedPosts,
  getPublishedShorts,
  getRecentShorts,
  getAllCanons,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllStrategies,
  getAllResources,
  getAllPrints,
  
  // By-Slug Getters
  getPostBySlug,
  getBookBySlug,
  getCanonBySlug,
  getShortBySlug,
  getDownloadBySlug,
  getResourceBySlug,
  getEventBySlug,
  getPrintBySlug,
  getStrategyBySlug,
  
  // Logic Helpers
  normalizeSlug,
  getDocHref,
  getDocKind,
  getShortUrl,
  isDraft,
  isPublished,
  assertContentlayerHasDocs,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
} from "./contentlayer-helper";

export type { DocKind, ContentDoc } from "./contentlayer-helper";

// ============================================================================
// Input Validation & Sanitization
// ============================================================================
export {
  sanitizeInput,
  isValidEmail,
  isValidUrl,
  sanitizeObject,
  containsSqlInjection,
  containsXss,
  validateApiInput,
} from "./input-validator";

// ============================================================================
// Rate Limiting
// ============================================================================
export {
  rateLimit,
  rateLimitAsync,
  markRequestSuccess,
  createRateLimitHeaders,
  getRateLimitStatus,
  resetRateLimit,
  blockPermanently,
  unblock,
  getRateLimiterStats,
  getClientIpFromRequest,
  isValidIp,
  anonymizeIp,
  generateRateLimitKey,
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
} from "./rate-limit";

export type { RateLimitConfig, RateLimitResult } from "./rate-limit";

// ============================================================================
// Security Monitoring (if available)
// ============================================================================
export {
  detectSqlInjection,
  detectXss,
  detectPathTraversal,
  detectSuspiciousHeaders,
  logSecurityEvent,
  getSecurityEvents,
  getSecurityEventsByIp,
  getSuspiciousIps,
  clearSecurityHistory,
  securityMiddleware,
} from "./security-monitor";

// ============================================================================
// Inner Circle (if available)
// ============================================================================
export {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  recordInnerCircleUnlock,
  revokeInnerCircleKey,
  deleteMemberByEmail,
  getPrivacySafeStats,
  getActiveKeysForMember,
  sendInnerCircleEmail,
  getClientIp,
  getPrivacySafeKeyExport,
  cleanupOldData,
} from "./inner-circle";

export type {
  InnerCircleStatus,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleStore,
} from "./inner-circle";