// lib/inner-circle/index.ts
// MAIN ENTRYPOINT (SAFE BARREL)

// Client-safe wrapper (this already re-exports what's needed)
export * from "./access";

// Client utilities
export { 
  hasInnerCircleAccess,
  checkClientAccess 
} from "./access.client";

// Server utilities (explicit named exports)
export type { 
  InnerCircleAccess as ServerInnerCircleAccess,
  InnerCircleTier 
} from "./access.server";

export { 
  getInnerCircleAccess,
  normalizeTier 
} from "./access.server";

// Keys client (if exists)
export * from "./keys.client";