// lib/imports.ts - FIXED
// Central barrel export for client-safe utilities

export { siteConfig, getPageTitle, absUrl } from "./siteConfig";

// Main exports - simple and direct
// Remove default export since contentlayer-helper doesn't have one
export * from "./contentlayer-helper";

// Export other utilities
export * from "./input-validator";
export * from "./rate-limit";

// Optional: Health check function (no dependencies on imports)
export const checkImports = () => {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
  };
};