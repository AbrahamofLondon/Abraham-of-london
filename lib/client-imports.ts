// lib/client-imports.ts - CORRECTED
// Re-export client-safe utilities

// Site configuration
export { siteConfig, canonicalUrl, authorImage } from '@/config/site';

// Page utilities
export { getPageTitle } from '@/lib/utils/getPageTitle';

// Add any other client-safe utilities here

// Safe environment variables for client
export const clientEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abrahamoflondon.org',
  isProduction: process.env.NODE_ENV === 'production',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
};

// Type for client environment
export type ClientEnv = typeof clientEnv;