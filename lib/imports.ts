// lib/imports.ts
// Central barrel export for all lib utilities
// NOTE: Only exports client-safe utilities. Server-only modules like 
// inner-circle.ts must be imported directly in API routes.

// ============================================================================
// Site Configuration
// ============================================================================
export const siteConfig = {
  siteName: "Abraham of London",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
  description: "Strategic assets for institutional architects",
  author: "Abraham of London",
  social: {
    twitter: "@abrahamoflondon",
    linkedin: "abrahamoflondon",
  },
};

export function getPageTitle(title?: string): string {
  return title ? `${title} | ${siteConfig.siteName}` : siteConfig.siteName;
}

// ============================================================================
// Contentlayer Helpers - Client-safe
// ============================================================================
export * from "./contentlayer-helper";

// ============================================================================
// Input Validation - Client-safe
// ============================================================================
export * from "./input-validator";

// ============================================================================
// Rate Limiting - Client-safe (uses in-memory storage)
// ============================================================================
export * from "./rate-limit";

// ============================================================================
// Security Monitoring - Client-safe
// ============================================================================
// Uncomment when security-monitor.ts is ready
// export * from "./security-monitor";

// ============================================================================
// ⚠️ DO NOT EXPORT SERVER-ONLY MODULES HERE
// ============================================================================
// The following modules use Node.js built-ins (crypto, pg, dns, net, tls)
// and must ONLY be imported directly in API routes:
//
// - lib/inner-circle.ts (uses pg, crypto)
// - lib/server/* (any server-only utilities)
//
// To use them in API routes:
//   import { functionName } from "@/lib/inner-circle";
//
// ============================================================================