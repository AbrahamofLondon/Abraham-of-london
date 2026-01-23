// @/lib/client/imports.ts - FIXED VERSION
/**
 * Client-safe re-exports from the main imports file
 * This ensures no server modules accidentally get imported on client
 */

// Import siteConfig directly from config (avoid circular imports)
import { siteConfig as importedSiteConfig } from "@/config/site";

// Import utility functions
import { getPageTitle as getPageTitleFunc } from "@/lib/utils/getPageTitle";
import { absUrl as absUrlFunc, isInternalUrl, normalizePath } from "@/lib/utils/url-helpers";

// Re-export the actual values
export const siteConfig = importedSiteConfig;
export const getPageTitle = getPageTitleFunc;
export const absUrl = absUrlFunc;

// Input validation
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
export async function rateLimit() { 
  return { 
    allowed: true, 
    remaining: 100 
  };
}

export function createRateLimitHeaders() {
  return {};
}

export const RATE_LIMIT_CONFIGS = {
  API_GENERAL: { limit: 100, windowMs: 60000 },
  AUTH: { limit: 10, windowMs: 60000 },
  UPLOAD: { limit: 5, windowMs: 60000 }
};

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
  getDocumentsByTag: () => [],
  getDocumentsByCategory: () => []
};

// Utility functions for client
export function getCanonicalUrl(path: string = '/'): string {
  const baseUrl = siteConfig.url;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
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

// Re-export URL helpers
export { isInternalUrl, normalizePath };

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
  getCanonicalUrl,
  getOgImageUrl,
  getSocialUrl,
  isInternalUrl,
  normalizePath
};

export default importsApi;