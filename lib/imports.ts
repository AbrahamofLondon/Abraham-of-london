// lib/imports.ts - FIXED: Remove rate-limit import to avoid circular dependency
// Central barrel export for client-safe utilities

export { siteConfig, getPageTitle, absUrl } from "./siteConfig";

// Main exports - simple and direct
export * from "./contentlayer-helper";

// Export other utilities
export * from "./input-validator";

// Export rate-limit functions individually (not the whole module)
export {
  isValidIp,
  anonymizeIp,
  getClientIpFromRequest as getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS
} from "./rate-limit";

// Safe function to get rate limit without circular dependency
export const getRateLimit = async () => {
  const mod = await import("./rate-limit");
  return {
    rateLimitAsync: mod.rateLimitAsync,
    rateLimit: mod.rateLimit,
    withRateLimit: mod.withRateLimit,
    checkRateLimit: mod.checkRateLimit
  };
};

// Optional: Health check function (no dependencies on imports)
export const checkImports = () => {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
  };
};