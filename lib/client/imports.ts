// @/lib/client/imports.ts - CLIENT-SAFE RE-EXPORTS ONLY
/**
 * Client-safe re-exports from the main imports file
 * This ensures no server modules accidentally get imported on client
 */

export { siteConfig, getPageTitle, absUrl } from "@/lib/imports";
export * from "@/lib/input-validator";

// Client-safe versions of utilities
export function getClientIpFallback(): string {
  return 'client-unknown';
}

export function isValidIp(ip: string): boolean {
  // Simple client-side validation
  if (!ip || ip === 'unknown') return false;
  return /^[\d.:a-fA-F]+$/.test(ip);
}

export function anonymizeIp(ip: string): string {
  return 'anonymized';
}

// Stub functions for client
export const rateLimit = async () => ({ 
  allowed: true, 
  remaining: 100 
});

export const createRateLimitHeaders = () => ({});
export const RATE_LIMIT_CONFIGS = {};

export function checkImports() {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    environment: 'client'
  };
}

// Contentlayer stubs for client
export const contentlayerHelper = {
  getAllDocuments: () => [],
  getDocumentBySlug: () => null,
  getPublishedDocuments: () => [],
};],
  getDocumentBySlug: (slug: string) => {
    const data = getContentlayerData();
    return data.allDocuments?.find(doc => 
      doc.slug === slug || 
      doc._raw?.flattenedPath === slug
    ) || null;
  },
  getPublishedDocuments: () => getPublishedDocuments(),
};

// IP utilities (client-safe fallbacks)
export function getClientIpFallback(req?: any): string {
  if (typeof window !== 'undefined') {
    return 'client-unknown';
  }
  
  // Server-side fallback
  if (req?.headers?.['x-forwarded-for']) {
    const forwarded = req.headers['x-forwarded-for'];
    if (Array.isArray(forwarded)) return forwarded[0];
    return forwarded.split(',')[0].trim();
  }
  return req?.socket?.remoteAddress || 'server-unknown';
}

export function isValidIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  const cleanIp = (ip.split(':')[0] || '').trim();
  
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4Regex.test(cleanIp)) return true;
  
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
  
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    if (parts.length <= 3) return cleanIp;
    return `${parts.slice(0, Math.min(2, parts.length)).join(':')}::`;
  }
  
  const parts = cleanIp.split('.');
  if (parts.length !== 4) return cleanIp;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}

// Rate limiting (client-safe stubs)
export const rateLimit = async () => ({ 
  allowed: true, 
  remaining: 100, 
  retryAfterMs: 0,
  resetTime: Date.now() + 3600000,
  limit: 100,
  windowMs: 3600000
});

export const createRateLimitHeaders = () => ({});
export const RATE_LIMIT_CONFIGS = {};

// Health check
export function checkImports() {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    environment: typeof window !== 'undefined' ? 'client' : 'server',
    siteConfig: !!siteConfig,
    contentlayer: !!getContentlayerData
  };
}

// Default export
export default {
  siteConfig,
  getPageTitle,
  absUrl,
  contentlayerHelper,
  getClientIpFallback,
  isValidIp,
  anonymizeIp,
  rateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  checkImports
};