// lib/rate-limit/index.ts
// ONLY export client-side rate limiting
export { withRateLimit } from './rate-limit'

// Only client-safe types
export type {
  RateLimitOptions,
  RateLimitResult
} from './server/rate-limit'