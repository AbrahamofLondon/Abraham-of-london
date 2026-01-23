// @/lib/imports.ts - MAIN EXPORT FILE (UPDATED)
/**
 * Main imports file - exports everything needed by the app
 * This should be safe for both client and server
 */

// Re-export from your actual config file
export { siteConfig, canonicalUrl, authorImage } from "@/config/site";

// Utility functions
export { getPageTitle } from "@/lib/utils/getPageTitle";
export { absUrl, isInternalUrl, normalizePath } from "@/lib/utils/url-helpers";

// Input validation
export * from "@/lib/input-validator";

// Contentlayer helpers - client-safe versions
import { getContentlayerData, getPublishedDocuments } from "./contentlayer-compat";

export const contentlayerHelper = {
  getAllDocuments: () => getContentlayerData().allDocuments || [],
  getDocumentBySlug: (slug: string) => {
    const data = getContentlayerData();
    return data.allDocuments?.find(doc => 
      doc.slug === slug || 
      doc._raw?.flattenedPath === slug
    ) || null;
  },
  getPublishedDocuments: () => getPublishedDocuments(),
  getDocumentsByTag: (tag: string) => {
    const data = getContentlayerData();
    return data.allDocuments?.filter(doc => 
      doc.tags?.includes(tag) || 
      doc._raw?.tags?.includes(tag)
    ) || [];
  },
  getDocumentsByCategory: (category: string) => {
    const data = getContentlayerData();
    return data.allDocuments?.filter(doc => 
      doc.category === category || 
      doc._raw?.category === category
    ) || [];
  }
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
export async function rateLimit(options?: any) { 
  return { 
    allowed: true, 
    remaining: 100, 
    retryAfterMs: 0,
    resetTime: Date.now() + 3600000,
    limit: 100,
    windowMs: 3600000
  };
}

export function createRateLimitHeaders(result?: any) {
  return {};
}

export const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { limit: 100, windowMs: 60000 },
  AUTH: { limit: 10, windowMs: 60000 },
  UPLOAD: { limit: 5, windowMs: 60000 }
};

// Additional utilities
export function getMetaDescription(customDescription?: string): string {
  return customDescription || siteConfig.seo.description;
}

export function getOgImageUrl(path?: string): string {
  const baseUrl = siteConfig.url;
  const ogImage = siteConfig.seo.openGraphImage || '/assets/images/social/og-image.jpg';
  
  if (path) {
    return `${baseUrl}${path}`;
  }
  
  return `${baseUrl}${ogImage}`;
}

export function getSocialUrl(platform: string): string | null {
  const social = siteConfig.socials.find(s => s.kind === platform);
  return social?.href || null;
}

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
const importsApi = {
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
  checkImports,
  getMetaDescription,
  getOgImageUrl,
  getSocialUrl,
  canonicalUrl,
  authorImage
};

export default importsApi;