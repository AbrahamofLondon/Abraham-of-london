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
};

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
  checkImports

};
export default importsApi;
