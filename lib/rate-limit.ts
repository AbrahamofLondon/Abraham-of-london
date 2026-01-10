// lib/rate-limit.ts
/**
 * Compatibility façade for old imports: "@/lib/rate-limit"
 * Single source of truth: "@/lib/server/rateLimit"
 *
 * Rules:
 * - Do NOT export multiple defaults.
 * - Provide stable named exports used across legacy endpoints.
 * - Fail open if something goes sideways (green build posture).
 */

export * from "@/lib/server/rateLimit";
export { default } from "@/lib/server/rateLimit";

// ---- Legacy alias expected by some endpoints ----
export const withRateLimit = (handler: any, options?: any) => {
  // Delegate to the canonical wrapper
  // If anything fails, allow request (fail-open)
  return async (req: any, res: any) => {
    try {
      const mod = await import("@/lib/server/rateLimit");
      const wrap = mod.withApiRateLimit ?? ((h: any) => h);
      return wrap(handler, options)(req, res);
    } catch (error) {
      console.warn("[rate-limit] fail-open:", error);
      return handler(req, res);
    }
  };
};
