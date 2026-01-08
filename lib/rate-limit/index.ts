// lib/rate-limit/index.ts
// Re-export everything from the rate-limit module

// First, export the direct re-exports
export { withRateLimit } from './rate-limit'

// Import and re-export from server/rate-limit
export { 
  isRateLimited,
  withApiRateLimit,
  rateLimitForRequestIp 
} from './server/rate-limit'

// Also export types for completeness
export type {
  RateLimitOptions,
  RateLimitResult,
  TokenBucketOptions,
  LegacyIsRateLimitedResult
} from './server/rate-limit'

// Export the configs
export { RATE_LIMIT_CONFIGS } from './server/rate-limit'

// Create a default export that includes everything
const rateLimitModule = {
  // Core functions
  withRateLimit: async (handler: any, options?: any) => {
    const { withRateLimit } = await import('./rate-limit')
    return withRateLimit(handler, options)
  },
  
  isRateLimited: async (key: string, bucket: string, limit: number) => {
    const { isRateLimited } = await import('./server/rate-limit')
    return isRateLimited(key, bucket, limit)
  },
  
  withApiRateLimit: (handler: any, options?: any) => {
    const { withApiRateLimit } = require('./server/rate-limit')
    return withApiRateLimit(handler, options)
  },
  
  rateLimitForRequestIp: (req: any, bucket: string, limit: number, windowMs?: number) => {
    const { rateLimitForRequestIp } = require('./server/rate-limit')
    return rateLimitForRequestIp(req, bucket, limit, windowMs)
  },
  
  // Rate limit function (alias)
  rateLimit: async (key: string, options?: any) => {
    const { rateLimit } = await import('./server/rate-limit')
    return rateLimit(key, options)
  },
  
  // Utility functions
  getClientIp: (req: any) => {
    const { getClientIp } = require('./server/rate-limit')
    return getClientIp(req)
  },
  
  createRateLimitHeaders: (result: any) => {
    const { createRateLimitHeaders } = require('./server/rate-limit')
    return createRateLimitHeaders(result)
  },
  
  // Configs
  RATE_LIMIT_CONFIGS: require('./server/rate-limit').RATE_LIMIT_CONFIGS
};

export default rateLimitModule;