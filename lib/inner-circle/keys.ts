// lib/inner-circle/keys.ts
// CLIENT-SAFE FACADE (STATIC EXPORTS ONLY)
// Anything server-only must be imported from "./keys.server" explicitly.

export type {
  KeyTier,
  StoredKey,
  CreateOrUpdateMemberArgs,
  IssuedKey,
  VerifyInnerCircleKeyResult,
  InnerCircleStats,
  CleanupResult,
} from "./keys.client";

// Export ONLY client-safe functions here.
// If getEmailHash is implemented in keys.client.ts, it's safe to export.
// Do NOT export server functions from this file.
export { getEmailHash } from "./keys.client";