// lib/inner-circle/access.ts
// SAFE RE-EXPORTS ONLY - No server imports in client builds

// Re-export types
export type { InnerCircleAccess } from "./access.client";

// Export client-side functions only
export { hasInnerCircleAccess, checkClientAccess } from "./access.client";

// For server usage, import directly from "./access.server"
// This prevents bundling server code in client builds