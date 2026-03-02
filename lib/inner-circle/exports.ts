// lib/inner-circle/exports.ts
// CLIENT-SAFE EXPORTS ONLY. No server logic. No stubs.

export type { InnerCircleAccess } from "./access.client";
export { checkAccess, invalidateAccessCache } from "./access.client";
export { getEmailHash } from "./keys.client";

export const INNER_CIRCLE_CONFIG = {
  cookieName: "innerCircleAccess",
  localStorageKey: "innerCircleAccess",
  defaultTier: "inner-circle",
} as const;