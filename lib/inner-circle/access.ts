// lib/inner-circle/access.ts
// UNIVERSAL ROUTER (SAFE):
// - exports client-only helpers
// - exports server-only helpers by re-exporting from access.server
// - contains NO Node-only logic directly (no Buffer, no crypto, etc.)

export type { InnerCircleAccess } from "./access.client";
export { hasInnerCircleAccess, checkClientAccess } from "./access.client";

// Server-side exports (only exist on server)
export {
  getInnerCircleAccess,
  withInnerCircleAccess,
  getClientIp,
  rateLimitForRequestIp,
  createPublicApiHandler,
  createStrictApiHandler,
  withInnerCircleRateLimit,
  getPrivacySafeStatsWithRateLimit,
  verifyInnerCircleKeyWithRateLimit,
  getPrivacySafeKeyExportWithRateLimit,
  createOrUpdateMemberAndIssueKeyWithRateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  createAccessToken,
} from "./access.server";