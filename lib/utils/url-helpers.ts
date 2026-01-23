// lib/utils/url-helpers.ts
import { siteConfig } from "@/config/site";

/**
 * Get absolute URL for a given path
 */
export function absUrl(path: string = '/'): string {
  const baseUrl = siteConfig.url;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Check if a URL is internal (same origin)
 */
export function isInternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrl = new URL(siteConfig.url);
    return urlObj.origin === baseUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Normalize a URL path
 */
export function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}