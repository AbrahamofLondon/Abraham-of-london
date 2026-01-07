// lib/imports.ts - Build-safe imports
/**
 * Central barrel export for client-safe utilities
 * Avoids circular dependencies and server-only imports
 */

// Site config
export { siteConfig, getPageTitle, absUrl } from "./siteConfig";

// ContentLayer helpers
export * from "./contentlayer-helper";

// Input validation
export * from "./input-validator";

// Rate limiting - use memory-based version to avoid ioredis
export {
  getClientIp,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  type RateLimitOptions,
  type RateLimitResult,
} from "./server/rateLimit";

// IP utilities - safe implementations
export function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  const cleanIp = (ip.split(':')[0] || '').trim();
  
  // IPv4 validation
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4Regex.test(cleanIp)) return true;
  
  // IPv6 validation
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    if (parts.length > 8) return false;
    return parts.every(part => part === '' || /^[0-9a-fA-F]{1,4}$/.test(part));
  }
  
  return false;
}

export function anonymizeIp(ip: string): string {
  if (!isValidIp(ip) || ip === 'unknown') return 'unknown';
  const cleanIp = (ip.split(':')[0] || '').trim();
  
  // IPv6 anonymization
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    if (parts.length <= 3) return cleanIp;
    return `${parts.slice(0, Math.min(2, parts.length)).join(':')}::`;
  }
  
  // IPv4 anonymization
  const parts = cleanIp.split('.');
  if (parts.length !== 4) return cleanIp;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}

// Async rate limit loader - avoids circular dependencies
export async function getRateLimit() {
  try {
    const mod = await import("./server/rateLimit");
    return {
      rateLimit: mod.rateLimit,
      getClientIp: mod.getClientIp,
      createRateLimitHeaders: mod.createRateLimitHeaders,
      RATE_LIMIT_CONFIGS: mod.RATE_LIMIT_CONFIGS,
    };
  } catch (error) {
    console.warn('[imports] Rate limit module not available');
    return {
      rateLimit: async () => ({ 
        allowed: true, 
        remaining: 100, 
        retryAfterMs: 0,
        resetTime: Date.now() + 3600000,
        limit: 100,
        windowMs: 3600000
      }),
      getClientIp: () => 'unknown',
      createRateLimitHeaders: () => ({}),
      RATE_LIMIT_CONFIGS: {},
    };
  }
}

// Health check
export function checkImports() {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
  };
}