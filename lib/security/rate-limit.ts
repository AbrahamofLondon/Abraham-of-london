// lib/security/rate-limit.ts
export {
  limitIp,
  limitEmail,
  setRateLimitHeaders,
  consumeRateLimit,
  attachRateLimitHeaders,
} from "./rateLimit";

export type {
  LimitConfig,
  LimitResult,
  ConsumeRateLimitResult,
} from "./rateLimit";