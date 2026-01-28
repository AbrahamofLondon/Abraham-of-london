// lib/content/shared.ts - COMPLETE VERSION
/**
 * Shared utilities for content handling (client-safe)
 * Re-exports from utils.ts which re-exports from client-utils.ts
 */

export {
  normalizeSlug,
  isDraftContent,
  isPublished,
  getAccessLevel,
  getDocHref,
  getDocKind,
  sanitizeData,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl
} from "./utils";