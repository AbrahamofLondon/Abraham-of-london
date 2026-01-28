// lib/inner-circle/access.ts - FIXED
// Re-export for API compatibility

export function createAccessToken(payload: {
  email: string;
  name?: string;
  tier?: string;
  expiresIn?: string;
}): string {
  // This is a server-side implementation
  // In a real app, you'd use JWT or similar
  const tokenData = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
  };
  
  // For now, return a base64 encoded string
  // In production, use proper JWT signing
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

// Re-export types
export type { InnerCircleAccess } from "./access.client";

// Export client-side functions
export { hasInnerCircleAccess, checkClientAccess } from "./access.client";

// Export from access.server for API routes - ONLY WHAT EXISTS
export { 
  // These are the actual functions that exist in access.server.ts
  getPrivacySafeStatsWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  withInnerCircleRateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  createStrictApiHandler,
  createPublicApiHandler
} from "./access.server";