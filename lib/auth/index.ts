// lib/auth/index.ts — MAIN ENTRY POINT (EXPORTS EVERYTHING)
export { authOptions, getAuthSession } from "./options";
export { default } from "./options";

// Export all auth utilities
export * from "./client";
export * from "./server";

// Export HOCs
export { withInnerCircleAuth } from "./withInnerCircleAuth";
export { withUnifiedAuth } from "./withUnifiedAuth";

// Export types
export type { AccessTier } from "@/lib/access/tier-policy";
