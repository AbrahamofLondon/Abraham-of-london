// lib/pdf/types.ts — SSOT PDF TYPES (Aligned with AccessTier)
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AccessTier } from "@/lib/access/tier-policy";

/**
 * PDF Tier - SSOT aligned
 * Use AccessTier directly, but keep this alias for backward compatibility
 */
export type PDFTier = AccessTier;

/**
 * Legacy PDF tier values for backward compatibility
 * These will be normalized via tier-policy.ts
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
  | "editorial"      // Opinion pieces, essays
  | "framework"      // Strategic frameworks
  | "academic"       // Research, academic papers
  | "strategic"      // Strategic documents
  | "tool"           // Practical tools
  | "canvas"         // Visual frameworks/canvases
  | "worksheet"      // Fillable worksheets
  | "assessment"     // Assessments/evaluations
  | "journal"        // Journals, logs
  | "tracker"        // Tracking sheets
  | "bundle"         // Collections of documents
  | "toolkit"        // Tool collections
  | "playbook"       // Strategic playbooks
  | "brief"          // Briefing documents
  | "checklist"      // Checklists
  | "pack"           // Resource packs
  | "blueprint"      // Blueprints/plans
  | "liturgy"        // Liturgical documents
  | "study"          // Study guides
  | "other";         // Uncategorized

/**
 * Base PDF item interface
 */
export interface PDFItem {
  // Core identifiers
  id: string;
  title: string;
  
  // Classification
  type: PDFType;
  tier: PDFTier;                    // SSOT tier
  legacyTier?: LegacyPDFTier;        // Original tier if migrated
  
  // File information
  outputPath: string;
  fileUrl?: string;                  // For backward compatibility
  
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
  requiresAuth?: boolean;             // Derived from tier != "public"
  
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
 * Helper to get normalized tier from PDF item
 */
export function getPDFTier(pdf: PDFItem | { tier?: string }): AccessTier {
  const { normalizeRequiredTier } = require('@/lib/access/tier-policy');
  return normalizeRequiredTier(pdf.tier || "public");
}

/**
 * Check if PDF requires authentication
 */
export function pdfRequiresAuth(pdf: PDFItem | { tier?: string }): boolean {
  const { normalizeRequiredTier } = require('@/lib/access/tier-policy');
  return normalizeRequiredTier(pdf.tier || "public") !== "public";
}

/**
 * Check if user can access PDF
 */
export function canAccessPDF(
  pdf: PDFItem | { tier?: string },
  userTier?: string | AccessTier | null
): boolean {
  const { normalizeUserTier, hasAccess } = require('@/lib/access/tier-policy');
  const required = normalizeRequiredTier(pdf.tier || "public");
  const user = normalizeUserTier(userTier || "public");
  return hasAccess(user, required);
}