// lib/inner-circle/exports.ts
// CLIENT-SAFE EXPORTS ONLY. No server logic. No stubs.

export type { InnerCircleAccess } from "./access.client";
export { hasInnerCircleAccess, checkClientAccess } from "./access.client";

// IMPORTANT: avoid importing ./keys (dynamic require facade).
// If you truly need getEmailHash client-side, export it from keys.client directly.
export { getEmailHash } from "./keys.client";

// Small client config is fine if it contains no secrets and no server deps.
export const INNER_CIRCLE_CONFIG = {
  cookieName: "innerCircleAccess",
  localStorageKey: "innerCircleAccess",
  defaultTier: "inner-circle",
} as const;