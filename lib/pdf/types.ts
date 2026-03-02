// lib/pdf/types.ts — SSOT PDF TYPES (Aligned with AccessTier)
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

/**
 * PDF Tier - SSOT aligned
 * Use AccessTier directly, but keep this alias for backward compatibility
 */
export type PDFTier = AccessTier;

/**
 * Legacy PDF tier values for backward compatibility
 * These will be normalized via normalizeUserTier().
 */
export type LegacyPDFTier = "free" | "member" | "architect" | "inner-circle" | "inner-circle-elite";

/**
 * Paper format options
 */
export type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

/**
 * PDF file format
 */
export type PDFFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";

/**
 * PDF content type classification
 * Expanded to match all usage across the codebase
 */
export type PDFType =
  | "editorial"
  | "framework"
  | "academic"
  | "strategic"
  | "tool"
  | "canvas"
  | "worksheet"
  | "assessment"
  | "journal"
  | "tracker"
  | "bundle"
  | "toolkit"
  | "playbook"
  | "brief"
  | "checklist"
  | "pack"
  | "blueprint"
  | "liturgy"
  | "study"
  | "other";

/**
 * Base PDF item interface
 */
export interface PDFItem {
  // Core identifiers
  id: string;
  title: string;

  // Classification
  type: PDFType;
  tier: PDFTier; // SSOT tier
  legacyTier?: LegacyPDFTier;

  // File information
  outputPath: string;
  fileUrl?: string; // legacy alias

  // Metadata
  description?: string;
  excerpt?: string;
  tags?: string[];

  // Format information
  formats?: PaperFormat[];
  format?: PDFFormat;

  // Feature flags
  isInteractive?: boolean;
  isFillable?: boolean;
  requiresAuth?: boolean;

  // Versioning
  version?: string;
  author?: string;
  category?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // Sorting
  priority?: number;
  preload?: boolean;

  // Build metadata
  exists?: boolean;
  fileSize?: string;
  fileSizeBytes?: number;
  lastModified?: string;

  // Error state
  error?: string;

  // Allow additional fields
  [key: string]: any;
}

/**
 * Internal: resolve required tier for a PDF from messy legacy values.
 * IMPORTANT:
 * - We intentionally use normalizeUserTier() because it already maps/normalizes
 *   aliases (including "free" -> "public" if your SSOT does that).
 */
function resolveRequiredTier(pdf: PDFItem | { tier?: string | AccessTier | null | undefined }): AccessTier {
  return normalizeUserTier((pdf as any)?.tier ?? "public");
}

/**
 * Helper to get normalized tier from PDF item
 */
export function getPDFTier(pdf: PDFItem | { tier?: string | AccessTier | null | undefined }): AccessTier {
  return resolveRequiredTier(pdf);
}

/**
 * Check if PDF requires authentication
 */
export function pdfRequiresAuth(pdf: PDFItem | { tier?: string | AccessTier | null | undefined }): boolean {
  return resolveRequiredTier(pdf) !== "public";
}

/**
 * Check if user can access PDF
 */
export function canAccessPDF(
  pdf: PDFItem | { tier?: string | AccessTier | null | undefined },
  userTier?: string | AccessTier | null,
): boolean {
  const required = resolveRequiredTier(pdf);
  const user = normalizeUserTier(userTier ?? "public");
  return hasAccess(user, required);
}