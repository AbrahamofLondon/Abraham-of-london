// lib/imports.ts
// Central barrel export for client-safe utilities

export { siteConfig, getPageTitle, absUrl } from "./siteConfig";

// Main exports - simple and direct
export { default as ContentHelper } from "./contentlayer-helper";
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