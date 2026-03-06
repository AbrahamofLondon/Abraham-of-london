/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/content/client-utils.ts — CLIENT-SAFE ONLY (SSOT RE-EXPORT)
// This file must NOT invent its own slug/href logic.
// It must mirror lib/content/shared.ts.

export type ContentDoc = any;

export {
  // Canonical utilities
  normalizeSlug,
  normalizeHref,
  stripCollectionPrefix,
  joinHref,

  // SSOT doc logic
  getDocKind,
  getDocHref,
  resolveDocCoverImage,
  resolveDocDownloadUrl,

  // Publish helpers
  isDraftContent,
  isPublished,

  // Access helpers (SSOT aligned)
  getAccessLevel,
  getDocTier,
  isPublic,
  requiresAuth,

  // Safe serialization
  sanitizeData,
  toUiDoc,
} from "@/lib/content/shared";