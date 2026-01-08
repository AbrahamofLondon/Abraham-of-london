// lib/rate-limit.ts
// Compatibility façade for old imports: "@/lib/rate-limit"
export * from "@/lib/server/rate-limit-unified";
export { default } from "@/lib/server/rate-limit-unified";
export { withApiRateLimit as withRateLimit } from "@/lib/server/rateLimit";
export * from "@/lib/server/rateLimit";
export { default } from "@/lib/server/rateLimit";

// Legacy alias expected by some endpoints
export const withRateLimit = (handler: any, options: any) => {
  return async (req: any, res: any) => {
    try {
      const { withApiRateLimit } = await import("@/lib/server/rate-limit-unified");
      return withApiRateLimit(handler, options)(req, res);
    } catch (error) {
      console.warn("Rate limiting failed, allowing request:", error);
      return handler(req, res);
    }
  };
};