// lib/inner-circle/config.ts
export const INNER_CIRCLE_CONFIG = {
  cookieName: "innerCircleAccess",
  tokenCookieName: "innerCircleToken",
  tiers: ["inner-circle", "inner-circle-plus", "inner-circle-elite"] as const,
};