// types/download.ts — SSOT DOWNLOAD META (Production Grade)

import type { AccessTier } from "@/lib/access/tier-policy";

/**
 * Canonical access tier union for downloads.
 * Uses SSOT (public < member < inner-circle < client < legacy < architect < owner)
 */
export type DownloadAccessLevel = AccessTier;

/**
 * Narrow, predictable file type labels used across UI.
 * Extend if you add more.
 */
export type DownloadFileType =
  | "pdf"
  | "xlsx"
  | "pptx"
  | "zip"
  | "docx"
  | "png"
  | "jpg"
  | "webp"
  | "binary";

/**
 * Cover image may be:
 * - string path
 * - Next Image object-ish (safe minimal)
 * - null/undefined
 */
export type DownloadCoverImage = string | { src?: string } | null;

export interface DownloadMeta {
  slug: string;
  title: string;

  // Text / description
  excerpt?: string;
  description?: string;

  // Classification
  category?: string;
  tags?: string[];

  // File information
  filePath?: string; // e.g. "/assets/downloads/..."
  fileSizeLabel?: string; // e.g. "2.3 MB PDF"
  fileType?: DownloadFileType;

  // Presentation
  coverImage?: DownloadCoverImage;
  heroImage?: string;
  readTime?: string; // for downloads that double as long-form reads

  // Editorial
  date?: string; // ISO string (YYYY-MM-DD recommended)
  author?: string;
  draft?: boolean;
  featured?: boolean;

  /**
   * Access control (SSOT)
   * - Prefer `accessLevel` (canonical).
   * - Keep `tier` as alias for older callers if they used that name.
   */
  accessLevel?: DownloadAccessLevel;
  tier?: DownloadAccessLevel; // backward-compatible alias

  lockMessage?: string | null;
}

/**
 * Backward compatibility alias
 */
export type DownloadItem = DownloadMeta;

/**
 * Utility: resolve the effective access level from either `accessLevel` or legacy `tier`.
 * Defaults to "public" (never accidentally lock content at the type layer).
 */
export function getDownloadAccessLevel(meta: DownloadMeta): DownloadAccessLevel {
  return (meta.accessLevel ?? meta.tier ?? "public") as DownloadAccessLevel;
}