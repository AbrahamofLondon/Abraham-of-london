// lib/utils/getPageTitle.ts
import { siteConfig } from '@/config/site';

/**
 * Generate a page title with site name
 */
export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) {
    return siteConfig.brand.name;
  }
  
  if (pageTitle.includes(siteConfig.brand.name)) {
    return pageTitle;
  }
  
  return `${pageTitle} | ${siteConfig.brand.name}`;
}

/**
 * Generate meta description with fallback
 */
export function getMetaDescription(customDescription?: string): string {
  return customDescription || siteConfig.seo.description;
}

/**
 * Generate canonical URL for a page
 */
export function getCanonicalUrl(path?: string): string {
  const baseUrl = siteConfig.url;
  const pagePath = path || '/';
  
  if (pagePath.startsWith('http')) {
    return pagePath;
  }
  
  return `${baseUrl}${pagePath.startsWith('/') ? pagePath : `/${pagePath}`}`;
}