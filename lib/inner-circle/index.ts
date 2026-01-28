// lib/inner-circle/index.ts
// MAIN ENTRYPOINT (SAFE BARREL)
// - No default export.
// - No re-export hop through ./exports (prevents circularity).
// - Export explicit, stable surfaces.

export * from "./access";          // client-safe wrapper
export * from "./access.client";   // client utilities/types
export * from "./access.server";   // server utilities (guarded by server-only inside file)
export * from "./keys.client";     // only if truly client-safe