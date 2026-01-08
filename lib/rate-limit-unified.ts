// lib/rate-limit-unified.ts
// Root-level façade for rate limiting - re-exports everything from server module

export * from "./server/rate-limit-unified";
export { default } from "./server/rate-limit-unified";

// Compatibility exports for any direct imports
export {
  rateLimit,
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  withApiRateLimit,
  withEdgeRateLimit,
  isRateLimited,
  checkRateLimit,
  rateLimitForRequestIp,
  getRateLimiterStats,
  resetRateLimit,
  unblock,
  type RateLimitOptions,
  type RateLimitResult
} from "./server/rate-limit-unified";