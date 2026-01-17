// @/lib/imports.ts - MAIN EXPORT FILE
/**
 * Main imports file - exports everything needed by the app
 * This should be safe for both client and server
 */

// Site configuration
export const siteConfig = {
  title: "Abraham of London",
  description: "Faith-rooted strategy and leadership for founders, leadership teams, and institutions that refuse to outsource responsibility.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
  brand: {
    tagline: "Faith · Strategy · Fatherhood",
    mission: "To restore faith-rooted leadership and strategy in a world that has outsourced responsibility."
  },
  contact: {
    email: "info@abrahamoflondon.org",
    phone: "+44 20 8622 5909",
    address: "Based in London, working globally"
  },
  socialLinks: [
    { kind: "twitter", label: "Twitter", href: "https://twitter.com/abrahamoflondon" },
    { kind: "linkedin", label: "LinkedIn", href: "https://linkedin.com/company/abrahamoflondon" },
    { kind: "instagram", label: "Instagram", href: "https://instagram.com/abrahamoflondon" },
    { kind: "youtube", label: "YouTube", href: "https://youtube.com/@abrahamoflondon" },
    { kind: "website", label: "Website", href: "https://www.abrahamoflondon.org" }
  ],
  navigation: {
    main: [
      { name: "Home", href: "/" },
      { name: "Essays", href: "/blog" },
      { name: "The Canon", href: "/canon" },
      { name: "Books", href: "/books" },
      { name: "Downloads", href: "/downloads" },
      { name: "Contact", href: "/contact" }
    ],
    footer: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      { name: "Accessibility", href: "/accessibility" },
      { name: "Security", href: "/security" }
    ]
  }
};

// Utility functions
export function getPageTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} | ${siteConfig.title}` : siteConfig.title;
}

export function absUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

// Simple validation utilities (client-safe)
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
