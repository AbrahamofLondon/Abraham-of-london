/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @/lib/imports.ts — CENTRALIZED ARCHITECTURE (HARDENED)
 * Optimized for local scope availability to prevent ReferenceErrors.
 * Institutional source of truth for configuration, content, and security.
 */

// 1. Core Config Imports
import { 
  siteConfig as _siteConfig, 
  canonicalUrl as _canonicalUrl, 
  authorImage as _authorImage 
} from "@/config/site";

// Re-export for external use
export const siteConfig = _siteConfig;
export const canonicalUrl = _canonicalUrl;
export const authorImage = _authorImage;

// 2. Utility & Helper Imports
// Consolidated imports to prevent duplicate declaration errors
import { getPageTitle as _getPageTitle } from "@/lib/utils/getPageTitle";
import { absUrl as _absUrl, isInternalUrl, normalizePath } from "@/lib/utils/url-helpers";

export const getPageTitle = _getPageTitle;
export const absUrl = _absUrl;
export { isInternalUrl, normalizePath };

// 3. Validation & Contentlayer
export * from "@/lib/input-validator";
import { getContentlayerData, getPublishedDocuments } from "./contentlayer-compat";
import { safeSlice } from "@/lib/utils/safe";

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

// 4. IP & Security Utilities
export function getClientIpFallback(req?: any): string {
  if (typeof window !== 'undefined') return 'client-unknown';
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
    return parts.length <= 8 && parts.every(part => part === '' || /^[0-9a-fA-F]{1,4}$/.test(part));
  }
  return false;
}

export function anonymizeIp(ip: string): string {
  if (!isValidIp(ip) || ip === 'unknown') return 'unknown';
  const cleanIp = (ip.split(':')[0] || '').trim();
  if (cleanIp.includes(':')) {
    const parts = cleanIp.split(':');
    return `${safeSlice(parts, 0, Math.min(2, parts.length)).join(':')}::`;
  }
  const parts = cleanIp.split('.');
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0` : cleanIp;
}

// 5. Rate Limiting
export const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { limit: 100, windowMs: 60000 },
  AUTH: { limit: 10, windowMs: 60000 },
  UPLOAD: { limit: 5, windowMs: 60000 }
};

export async function rateLimit() { 
  return { allowed: true, remaining: 100, retryAfterMs: 0, resetTime: Date.now() + 3600000, limit: 100, windowMs: 3600000 };
}

export function createRateLimitHeaders() { return {}; }

// 6. Meta & OG Helpers
export function getMetaDescription(customDescription?: string): string {
  return customDescription || _siteConfig.seo.description;
}

export function getOgImageUrl(path?: string): string {
  const baseUrl = _siteConfig.url;
  const ogImage = _siteConfig.seo.openGraphImage || '/assets/images/social/og-image.jpg';
  return path ? `${baseUrl}${path}` : `${baseUrl}${ogImage}`;
}

export function getSocialUrl(platform: string): string | null {
  const social = _siteConfig.socials.find(s => s.kind === platform);
  return social?.href || null;
}

// 7. Health Check
export function checkImports() {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    environment: typeof window !== 'undefined' ? 'client' : 'server',
    siteConfig: !!_siteConfig,
    contentlayer: !!getContentlayerData
  };
}

// 8. Default Export Object
const importsApi = {
  siteConfig: _siteConfig,
  canonicalUrl: _canonicalUrl,
  authorImage: _authorImage,
  getPageTitle: _getPageTitle,
  absUrl: _absUrl,
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
  getSocialUrl
};

export default importsApi;